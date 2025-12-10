import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dos services
vi.mock("../../src/services/itemService.js", () => ({
  createItem: vi.fn(),
  getAllItems: vi.fn(),
  getItemById: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  updateItemStatus: vi.fn(),
  reserveItem: vi.fn(),
  buyItem: vi.fn(),
}));

// Mock do logger
vi.mock("../../src/logger/logger.js", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do responseHelper
vi.mock("../../src/utils/responseHelper.js", () => ({
  successResponse: vi.fn((res, message, data) => ({
    success: true,
    message,
    data,
  })),
  createdResponse: vi.fn((res, message, data) => ({
    success: true,
    message,
    data,
  })),
  errorResponse: vi.fn((res, message, status) => ({
    success: false,
    message,
    status,
  })),
  notFoundResponse: vi.fn((res, message) => ({
    success: false,
    message,
  })),
}));

// Mock do errorHandler
vi.mock("../../src/middlewares/errorHandler.js", () => ({
  asyncHandler: (fn) => fn,
}));

// Importar após os mocks
import * as itemController from "../../src/controllers/itemController.js";
import * as itemService from "../../src/services/itemService.js";
import {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} from "../../src/utils/responseHelper.js";

describe("itemController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar mocks dos services
    vi.mocked(itemService.createItem).mockClear();
    vi.mocked(itemService.getAllItems).mockClear();
    vi.mocked(itemService.getItemById).mockClear();
    vi.mocked(itemService.updateItem).mockClear();
    vi.mocked(itemService.deleteItem).mockClear();
    vi.mocked(itemService.updateItemStatus).mockClear();
    vi.mocked(itemService.reserveItem).mockClear();
    vi.mocked(itemService.buyItem).mockClear();
  });

  describe("create", () => {
    it("deve criar um item com sucesso", async () => {
      const itemData = {
        title: "Novo Item",
        description: "Descrição do novo item com mais de 10 caracteres",
        price: 99.99,
      };

      const createdItem = {
        id: 1,
        ...itemData,
        ownerId: 1,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.createItem).mockResolvedValue(createdItem);

      const mockReq = {
        user: { id: 1 },
        body: itemData,
      };
      const mockRes = {};

      const result = await itemController.create(mockReq, mockRes);

      expect(itemService.createItem).toHaveBeenCalledWith(itemData, 1);
      expect(createdResponse).toHaveBeenCalledWith(
        mockRes,
        "Item criado com sucesso!",
        createdItem
      );
      expect(result.success).toBe(true);
    });
  });

  describe("getAll", () => {
    it("deve retornar lista de itens", async () => {
      const items = [
        {
          id: 1,
          title: "Item 1",
          description: "Descrição 1",
          price: 99.99,
          owner: { id: 1, name: "User", email: "user@example.com" },
        },
      ];

      vi.mocked(itemService.getAllItems).mockResolvedValue(items);

      const mockReq = { ip: "127.0.0.1" };
      const mockRes = {};

      const result = await itemController.getAll(mockReq, mockRes);

      expect(itemService.getAllItems).toHaveBeenCalledTimes(1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Itens listados com sucesso!",
        items
      );
      expect(result.success).toBe(true);
    });
  });

  describe("getById", () => {
    it("deve retornar um item pelo ID", async () => {
      const item = {
        id: 1,
        title: "Item Teste",
        description: "Descrição",
        price: 99.99,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.getItemById).mockResolvedValue(item);

      const mockReq = {
        params: { id: "1" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.getById(mockReq, mockRes);

      expect(itemService.getItemById).toHaveBeenCalledWith("1");
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Item encontrado!",
        item
      );
      expect(result.success).toBe(true);
    });

    it("deve retornar 404 quando item não existe", async () => {
      vi.mocked(itemService.getItemById).mockResolvedValue(null);

      const mockReq = {
        params: { id: "999" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.getById(mockReq, mockRes);

      expect(notFoundResponse).toHaveBeenCalledWith(mockRes, "Item não encontrado");
      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("deve atualizar um item com sucesso", async () => {
      const updateData = {
        title: "Item Atualizado",
        price: 149.99,
      };

      const updatedItem = {
        id: 1,
        ...updateData,
        description: "Descrição",
        ownerId: 1,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.updateItem).mockResolvedValue(updatedItem);

      const mockReq = {
        user: { id: 1 },
        params: { id: "1" },
        body: updateData,
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.update(mockReq, mockRes);

      expect(itemService.updateItem).toHaveBeenCalledWith("1", updateData, 1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Item atualizado com sucesso!",
        updatedItem
      );
      expect(result.success).toBe(true);
    });
  });

  describe("remove", () => {
    it("deve deletar um item com sucesso", async () => {
      const deleteResult = { message: "Item excluído com sucesso!" };

      vi.mocked(itemService.deleteItem).mockResolvedValue(deleteResult);

      const mockReq = {
        user: { id: 1 },
        params: { id: "1" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.remove(mockReq, mockRes);

      expect(itemService.deleteItem).toHaveBeenCalledWith("1", 1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        deleteResult.message || "Item excluído com sucesso!"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("updateStatus", () => {
    it("deve atualizar status do item com sucesso", async () => {
      const updatedItem = {
        id: 1,
        title: "Item Teste",
        status: "RESERVADO",
        ownerId: 1,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.updateItemStatus).mockResolvedValue(updatedItem);

      const mockReq = {
        user: { id: 1 },
        params: { id: "1" },
        body: { status: "RESERVADO" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.updateStatus(mockReq, mockRes);

      expect(itemService.updateItemStatus).toHaveBeenCalledWith("1", "RESERVADO", 1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Status do item atualizado com sucesso!",
        updatedItem
      );
      expect(result.success).toBe(true);
    });

    it("deve retornar erro 400 se status não for fornecido", async () => {
      const mockReq = {
        user: { id: 1 },
        params: { id: "1" },
        body: {},
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.updateStatus(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(mockRes, "Status é obrigatório", 400);
      expect(result.success).toBe(false);
    });
  });

  describe("reserve", () => {
    it("deve reservar um item com sucesso", async () => {
      const reservedItem = {
        id: 1,
        title: "Item Teste",
        status: "RESERVADO",
        ownerId: 1,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.reserveItem).mockResolvedValue(reservedItem);

      const mockReq = {
        user: { id: 2 },
        params: { id: "1" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.reserve(mockReq, mockRes);

      expect(itemService.reserveItem).toHaveBeenCalledWith("1", 2);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Item reservado com sucesso!",
        reservedItem
      );
      expect(result.success).toBe(true);
    });
  });

  describe("buy", () => {
    it("deve comprar um item com sucesso", async () => {
      const boughtItem = {
        id: 1,
        title: "Item Teste",
        status: "DOADO_VENDIDO",
        ownerId: 1,
        owner: { id: 1, name: "User", email: "user@example.com" },
      };

      vi.mocked(itemService.buyItem).mockResolvedValue(boughtItem);

      const mockReq = {
        user: { id: 2 },
        params: { id: "1" },
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await itemController.buy(mockReq, mockRes);

      expect(itemService.buyItem).toHaveBeenCalledWith("1", 2);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Item comprado com sucesso!",
        boughtItem
      );
      expect(result.success).toBe(true);
    });
  });
});

