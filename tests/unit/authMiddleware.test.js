import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";

// Mock do responseHelper
vi.mock("../../src/utils/responseHelper.js", () => ({
  unauthorizedResponse: vi.fn((res, message) => ({
    success: false,
    message,
    status: 401,
  })),
  forbiddenResponse: vi.fn((res, message) => ({
    success: false,
    message,
    status: 403,
  })),
}));

// Importar após os mocks
import { authenticateToken, optionalAuth } from "../../src/middlewares/authMiddleware.js";
import { unauthorizedResponse, forbiddenResponse } from "../../src/utils/responseHelper.js";

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("authenticateToken", () => {
    it("deve autenticar com token válido", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      const decodedUser = { id: 1, email: "test@example.com" };

      // Mock jwt.verify para chamar o callback com sucesso
      vi.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
        callback(null, decodedUser);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(decodedUser);
      expect(mockNext).toHaveBeenCalled();
      expect(unauthorizedResponse).not.toHaveBeenCalled();
      expect(forbiddenResponse).not.toHaveBeenCalled();
    });

    it("deve retornar 401 se token não for fornecido", () => {
      const mockReq = {
        headers: {},
      };
      const mockRes = {};
      const mockNext = vi.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(unauthorizedResponse).toHaveBeenCalledWith(mockRes, "Token não fornecido");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 401 se header authorization não tiver Bearer", () => {
      const mockReq = {
        headers: {
          authorization: "invalid-format",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(unauthorizedResponse).toHaveBeenCalledWith(mockRes, "Token não fornecido");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 403 se token for inválido", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      // Mock jwt.verify para chamar o callback com erro
      vi.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
        callback(new Error("Invalid token"), null);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(forbiddenResponse).toHaveBeenCalledWith(mockRes, "Token inválido ou expirado");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar 403 se token estiver expirado", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer expired-token",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";

      vi.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
        callback(expiredError, null);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(forbiddenResponse).toHaveBeenCalledWith(mockRes, "Token inválido ou expirado");
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("deve adicionar usuário se token for válido", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      const decodedUser = { id: 1, email: "test@example.com" };

      vi.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
        callback(null, decodedUser);
      });

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(decodedUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it("deve continuar sem usuário se token não for fornecido", () => {
      const mockReq = {
        headers: {},
      };
      const mockRes = {};
      const mockNext = vi.fn();

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("deve continuar sem usuário se token for inválido", () => {
      const mockReq = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      vi.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
        callback(new Error("Invalid token"), null);
      });

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

