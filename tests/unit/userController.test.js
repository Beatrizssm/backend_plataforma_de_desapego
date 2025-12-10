import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma } from "../mocks/prismaMock.js";

// Mock do módulo antes de importar (usando factory function)
vi.mock("../../src/prisma/client.js", () => {
  const { createMockPrisma } = require("../mocks/prismaMock.js");
  return {
    default: createMockPrisma(),
  };
});

// Mock do responseHelper
vi.mock("../../src/utils/responseHelper.js", () => ({
  successResponse: vi.fn((res, message, data) => ({
    success: true,
    message,
    data,
  })),
}));

// Mock do errorHandler
vi.mock("../../src/middlewares/errorHandler.js", () => ({
  asyncHandler: (fn) => fn,
}));

// Importar após os mocks
import * as userController from "../../src/controllers/userController.js";
import { successResponse } from "../../src/utils/responseHelper.js";
import prisma from "../../src/prisma/client.js";

describe("userController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("deve retornar lista de usuários com sucesso", async () => {
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

      vi.mocked(prisma.user.findMany).mockResolvedValue(users);

      const mockReq = {};
      const mockRes = {};

      const result = await userController.getAllUsers(mockReq, mockRes);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
          createdAt: true,
        },
      });

      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        "Usuários listados com sucesso!",
        users
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(users);
    });

    it("deve retornar array vazio quando não há usuários", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const mockReq = {};
      const mockRes = {};

      const result = await userController.getAllUsers(mockReq, mockRes);

      expect(result.data).toEqual([]);
    });
  });
});

