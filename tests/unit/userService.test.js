import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma } from "../mocks/prismaMock.js";

// Criar mock
const mockPrisma = createMockPrisma();

// Mock do módulo antes de importar o service
vi.mock("../../src/prisma/client.js", () => ({
  default: mockPrisma,
}));

// Importar service após o mock
let userService;

describe("userService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-importar service para garantir que os mocks estão ativos
    userService = await import("../../src/services/userService.js");
    userService = userService.default;
  });

  describe("getAllUsers", () => {
    it("deve retornar lista de usuários", async () => {
      const users = [
        {
          id: 1,
          name: "User 1",
          email: "user1@example.com",
          profile: "user",
          createdAt: new Date(),
        },
        {
          id: 2,
          name: "User 2",
          email: "user2@example.com",
          profile: "admin",
          createdAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await userService.getAllUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(users);
    });

    it("deve retornar array vazio quando não há usuários", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe("getUserById", () => {
    it("deve retornar um usuário pelo ID", async () => {
      const user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUserById(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(user);
    });

    it("deve converter string para número", async () => {
      const user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await userService.getUserById("1");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
    });

    it("deve retornar null quando usuário não existe", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("deve retornar um usuário pelo email", async () => {
      const user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        profile: "user",
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUserByEmail("test@example.com");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(user);
    });

    it("deve retornar null quando usuário não existe", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("deve criar um usuário com sucesso", async () => {
      const userData = {
        name: "New User",
        email: "new@example.com",
        password: "password123",
      };

      const createdUser = {
        id: 1,
        name: userData.name,
        email: userData.email,
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          profile: "user",
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(createdUser);
    });

    it("deve criar usuário com profile customizado", async () => {
      const userData = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        profile: "admin",
      };

      const createdUser = {
        id: 1,
        ...userData,
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          profile: "admin",
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
      expect(result.profile).toBe("admin");
    });
  });

  describe("updateUser", () => {
    it("deve atualizar um usuário com sucesso", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const updatedUser = {
        id: 1,
        name: updateData.name,
        email: updateData.email,
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateData.name,
          email: updateData.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it("deve atualizar apenas campos fornecidos", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const updatedUser = {
        id: 1,
        name: updateData.name,
        email: "original@example.com",
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await userService.updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateData.name,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
    });

    it("deve atualizar senha quando fornecida", async () => {
      const updateData = {
        password: "newPassword123",
      };

      const updatedUser = {
        id: 1,
        name: "User",
        email: "user@example.com",
        profile: "user",
        createdAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await userService.updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: updateData.password,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
    });

    it("deve converter string ID para número", async () => {
      const updateData = { name: "Updated" };
      mockPrisma.user.update.mockResolvedValue({ id: 1, ...updateData });

      await userService.updateUser("1", updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });
    });
  });

  describe("deleteUser", () => {
    it("deve deletar um usuário com sucesso", async () => {
      const deletedUser = {
        id: 1,
        name: "User",
        email: "user@example.com",
      };

      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      const result = await userService.deleteUser(1);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(deletedUser);
    });

    it("deve converter string ID para número", async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      await userService.deleteUser("1");

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});

