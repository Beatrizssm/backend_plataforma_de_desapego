import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma } from "../mocks/prismaMock.js";

// Criar mock
const mockPrisma = createMockPrisma();

// Mock do módulo antes de importar o service
vi.mock("../../src/prisma/client.js", () => ({
  default: mockPrisma,
}));

// Importar service após o mock
let createItem, getAllItems, getItemById, updateItem, deleteItem, reserveItem, buyItem, updateItemStatus;

describe("itemService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-importar services para garantir que os mocks estão ativos
    const itemService = await import("../../src/services/itemService.js");
    createItem = itemService.createItem;
    getAllItems = itemService.getAllItems;
    getItemById = itemService.getItemById;
    updateItem = itemService.updateItem;
    deleteItem = itemService.deleteItem;
    reserveItem = itemService.reserveItem;
    buyItem = itemService.buyItem;
    updateItemStatus = itemService.updateItemStatus;
  });

  describe("createItem", () => {
    it("deve criar um item com sucesso", async () => {
      const itemData = {
        title: "Item Teste",
        description: "Descrição do item teste com mais de 10 caracteres",
        price: 99.99,
        available: true,
        imageUrl: "https://example.com/image.jpg",
      };
      const userId = 1;

      const createdItem = {
        id: 1,
        ...itemData,
        ownerId: userId,
        owner: {
          id: userId,
          name: "Test User",
          email: "test@example.com",
        },
        createdAt: new Date(),
      };

      mockPrisma.item.create.mockResolvedValue(createdItem);

      const result = await createItem(itemData, userId);

      expect(mockPrisma.item.create).toHaveBeenCalledWith({
        data: {
          title: itemData.title.trim(),
          description: itemData.description.trim(),
          price: Number(itemData.price),
          available: itemData.available !== undefined ? Boolean(itemData.available) : true,
          status: itemData.status || "DISPONIVEL",
          imageUrl: itemData.imageUrl ? itemData.imageUrl.trim() : null,
          ownerId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(createdItem);
    });

    it("deve lançar erro se título for muito curto", async () => {
      const itemData = {
        title: "AB",
        description: "Descrição válida com mais de 10 caracteres",
        price: 99.99,
      };

      await expect(createItem(itemData, 1)).rejects.toThrow();
    });

    it("deve lançar erro se descrição for muito curta", async () => {
      const itemData = {
        title: "Título válido",
        description: "Curta",
        price: 99.99,
      };

      await expect(createItem(itemData, 1)).rejects.toThrow();
    });

    it("deve lançar erro se preço for inválido", async () => {
      const itemData = {
        title: "Título válido",
        description: "Descrição válida com mais de 10 caracteres",
        price: -10,
      };

      await expect(createItem(itemData, 1)).rejects.toThrow();
    });
  });

  describe("getAllItems", () => {
    it("deve retornar lista de itens", async () => {
      const items = [
        {
          id: 1,
          title: "Item 1",
          description: "Descrição 1",
          price: 99.99,
          owner: { id: 1, name: "User 1", email: "user1@example.com" },
        },
        {
          id: 2,
          title: "Item 2",
          description: "Descrição 2",
          price: 199.99,
          owner: { id: 2, name: "User 2", email: "user2@example.com" },
        },
      ];

      mockPrisma.item.findMany.mockResolvedValue(items);

      const result = await getAllItems();

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith({
        include: { owner: { select: { id: true, name: true, email: true } } },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(items);
    });
  });

  describe("getItemById", () => {
    it("deve retornar um item pelo ID", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        description: "Descrição do item",
        price: 99.99,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      const result = await getItemById(1);

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(item);
    });

    it("deve lançar erro para ID inválido", async () => {
      await expect(getItemById("invalid")).rejects.toThrow("ID inválido");
    });
  });

  describe("updateItem", () => {
    it("deve atualizar um item quando for o dono", async () => {
      const existingItem = {
        id: 1,
        title: "Item Original",
        description: "Descrição original",
        price: 99.99,
        ownerId: 1,
      };

      const updateData = {
        title: "Item Atualizado",
        price: 149.99,
      };

      const updatedItem = {
        ...existingItem,
        ...updateData,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(existingItem);
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      const result = await updateItem(1, updateData, 1);

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.item.update).toHaveBeenCalled();
      expect(result).toEqual(updatedItem);
    });

    it("deve lançar erro se item não existir", async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(updateItem(999, { title: "Novo" }, 1)).rejects.toThrow(
        "Item não encontrado"
      );
    });

    it("deve lançar erro se usuário não for o dono", async () => {
      const existingItem = {
        id: 1,
        title: "Item",
        description: "Descrição",
        price: 99.99,
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(existingItem);

      await expect(updateItem(1, { title: "Novo" }, 2)).rejects.toThrow("Acesso negado");
    });
  });

  describe("deleteItem", () => {
    it("deve deletar um item quando for o dono", async () => {
      const existingItem = {
        id: 1,
        title: "Item",
        description: "Descrição",
        price: 99.99,
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(existingItem);
      mockPrisma.item.delete.mockResolvedValue(existingItem);

      const result = await deleteItem(1, 1);

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.item.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toHaveProperty("message", "Item excluído com sucesso!");
    });

    it("deve lançar erro se item não existir", async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(deleteItem(999, 1)).rejects.toThrow("Item não encontrado");
    });

    it("deve lançar erro se usuário não for o dono", async () => {
      const existingItem = {
        id: 1,
        title: "Item",
        description: "Descrição",
        price: 99.99,
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(existingItem);

      await expect(deleteItem(1, 2)).rejects.toThrow("Acesso negado");
    });
  });

  describe("reserveItem", () => {
    it("deve reservar um item disponível com sucesso", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        description: "Descrição do item",
        price: 99.99,
        status: "DISPONIVEL",
        ownerId: 1,
      };

      const reservedItem = {
        ...item,
        status: "RESERVADO",
        available: false,
        owner: { id: 1, name: "Owner", email: "owner@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);
      mockPrisma.item.update.mockResolvedValue(reservedItem);

      const result = await reserveItem(1, 2); // userId 2 (não é o dono)

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "RESERVADO",
          available: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(reservedItem);
    });

    it("deve lançar erro se item não existir", async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(reserveItem(999, 1)).rejects.toThrow("Item não encontrado");
    });

    it("deve lançar erro se item não estiver disponível", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "RESERVADO",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(reserveItem(1, 2)).rejects.toThrow("não está disponível para reserva");
    });

    it("deve lançar erro se usuário tentar reservar seu próprio item", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DISPONIVEL",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(reserveItem(1, 1)).rejects.toThrow("Você não pode reservar seu próprio item");
    });
  });

  describe("buyItem", () => {
    it("deve comprar um item disponível com sucesso", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        description: "Descrição do item",
        price: 99.99,
        status: "DISPONIVEL",
        ownerId: 1,
      };

      const boughtItem = {
        ...item,
        status: "DOADO_VENDIDO",
        available: false,
        owner: { id: 1, name: "Owner", email: "owner@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);
      mockPrisma.item.update.mockResolvedValue(boughtItem);

      const result = await buyItem(1, 2); // userId 2 (não é o dono)

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "DOADO_VENDIDO",
          available: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(boughtItem);
    });

    it("deve comprar um item reservado com sucesso", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "RESERVADO",
        ownerId: 1,
      };

      const boughtItem = {
        ...item,
        status: "DOADO_VENDIDO",
        available: false,
        owner: { id: 1, name: "Owner", email: "owner@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);
      mockPrisma.item.update.mockResolvedValue(boughtItem);

      const result = await buyItem(1, 2);

      expect(result.status).toBe("DOADO_VENDIDO");
    });

    it("deve lançar erro se item não existir", async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(buyItem(999, 1)).rejects.toThrow("Item não encontrado");
    });

    it("deve lançar erro se item não estiver disponível ou reservado", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DOADO_VENDIDO",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(buyItem(1, 2)).rejects.toThrow("não está disponível para compra");
    });

    it("deve lançar erro se usuário tentar comprar seu próprio item", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DISPONIVEL",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(buyItem(1, 1)).rejects.toThrow("Você não pode comprar seu próprio item");
    });
  });

  describe("updateItemStatus", () => {
    it("deve atualizar status de DISPONIVEL para RESERVADO", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DISPONIVEL",
        ownerId: 1,
      };

      const updatedItem = {
        ...item,
        status: "RESERVADO",
        available: false,
        owner: { id: 1, name: "Owner", email: "owner@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      const result = await updateItemStatus(1, "RESERVADO", 1);

      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "RESERVADO",
          available: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedItem);
    });

    it("deve atualizar status de RESERVADO para DISPONIVEL", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "RESERVADO",
        ownerId: 1,
      };

      const updatedItem = {
        ...item,
        status: "DISPONIVEL",
        available: true,
        owner: { id: 1, name: "Owner", email: "owner@example.com" },
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);
      mockPrisma.item.update.mockResolvedValue(updatedItem);

      const result = await updateItemStatus(1, "DISPONIVEL", 1);

      expect(result.status).toBe("DISPONIVEL");
      expect(result.available).toBe(true);
    });

    it("deve lançar erro se status for inválido", async () => {
      await expect(updateItemStatus(1, "INVALID_STATUS", 1)).rejects.toThrow(
        "Status inválido"
      );
    });

    it("deve lançar erro se item não existir", async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(updateItemStatus(999, "RESERVADO", 1)).rejects.toThrow("Item não encontrado");
    });

    it("deve lançar erro se usuário não for o dono", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DISPONIVEL",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(updateItemStatus(1, "RESERVADO", 2)).rejects.toThrow("Acesso negado");
    });

    it("deve lançar erro se transição de status for inválida", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        status: "DOADO_VENDIDO",
        ownerId: 1,
      };

      mockPrisma.item.findUnique.mockResolvedValue(item);

      await expect(updateItemStatus(1, "DISPONIVEL", 1)).rejects.toThrow(
        "Transição de status inválida"
      );
    });
  });
});
