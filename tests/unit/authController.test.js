import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dos services
const mockRegisterUser = vi.fn();
const mockLoginUser = vi.fn();
const mockChangePassword = vi.fn();

vi.mock("../../src/services/authService.js", () => ({
  registerUser: (...args) => mockRegisterUser(...args),
  loginUser: (...args) => mockLoginUser(...args),
  changePassword: (...args) => mockChangePassword(...args),
}));

// Mock do logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock("../../src/logger/logger.js", () => ({
  default: mockLogger,
}));

// Mock do responseHelper
const mockSuccessResponse = vi.fn((res, message, data) => ({
  success: true,
  message,
  data,
}));
const mockCreatedResponse = vi.fn((res, message, data) => ({
  success: true,
  message,
  data,
}));
const mockErrorResponse = vi.fn((res, message, status) => ({
  success: false,
  message,
  status,
}));
const mockUnauthorizedResponse = vi.fn((res, message) => ({
  success: false,
  message,
  status: 401,
}));

vi.mock("../../src/utils/responseHelper.js", () => ({
  successResponse: mockSuccessResponse,
  createdResponse: mockCreatedResponse,
  errorResponse: mockErrorResponse,
  unauthorizedResponse: mockUnauthorizedResponse,
}));

// Mock do errorHandler
vi.mock("../../src/middlewares/errorHandler.js", () => ({
  asyncHandler: (fn) => fn,
}));

// Mock do jwt
const mockJwtSign = vi.fn();
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: mockJwtSign,
  },
}));

// Importar controller após mocks
let authController;

describe("authController", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1d";
    
    authController = await import("../../src/controllers/authController.js");
  });

  describe("register", () => {
    it("deve registrar um novo usuário com sucesso", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const createdUser = {
        id: 1,
        name: userData.name,
        email: userData.email,
      };

      const token = "mock-jwt-token";

      mockRegisterUser.mockResolvedValue(createdUser);
      mockJwtSign.mockReturnValue(token);

      const mockReq = {
        body: userData,
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.register(mockReq, mockRes);

      expect(mockRegisterUser).toHaveBeenCalledWith(
        userData.name,
        userData.email,
        userData.password
      );
      expect(mockJwtSign).toHaveBeenCalledWith(
        { id: createdUser.id, email: createdUser.email },
        "test-secret",
        { expiresIn: "1d" }
      );
      expect(mockCreatedResponse).toHaveBeenCalledWith(
        mockRes,
        "Usuário registrado com sucesso!",
        { user: createdUser, token }
      );
      expect(result.success).toBe(true);
    });

    it("deve retornar erro 400 se faltar campos obrigatórios", async () => {
      const mockReq = {
        body: {},
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.register(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Nome, e-mail e senha são obrigatórios",
        400
      );
      expect(result.success).toBe(false);
    });

    it("deve retornar erro se JWT_SECRET não estiver configurado", async () => {
      delete process.env.JWT_SECRET;

      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const createdUser = {
        id: 1,
        name: userData.name,
        email: userData.email,
      };

      mockRegisterUser.mockResolvedValue(createdUser);

      const mockReq = {
        body: userData,
        ip: "127.0.0.1",
      };
      const mockRes = {};

      await expect(authController.register(mockReq, mockRes)).rejects.toThrow(
        "JWT_SECRET não configurado"
      );

      // Restaurar para outros testes
      process.env.JWT_SECRET = "test-secret";
    });
  });

  describe("login", () => {
    it("deve fazer login com sucesso", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const user = {
        id: 1,
        name: "Test User",
        email: loginData.email,
      };

      const token = "mock-jwt-token";

      mockLoginUser.mockResolvedValue({ user, token });

      const mockReq = {
        body: loginData,
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.login(mockReq, mockRes);

      expect(mockLoginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        "Login realizado com sucesso!",
        { user, token }
      );
      expect(result.success).toBe(true);
    });

    it("deve retornar erro 401 se faltar email ou senha", async () => {
      const mockReq = {
        body: {},
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.login(mockReq, mockRes);

      expect(mockUnauthorizedResponse).toHaveBeenCalledWith(
        mockRes,
        "E-mail e senha são obrigatórios"
      );
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordController", () => {
    it("deve alterar senha com sucesso", async () => {
      const passwordData = {
        currentPassword: "oldPassword123",
        newPassword: "newPassword123",
      };

      mockChangePassword.mockResolvedValue(undefined);

      const mockReq = {
        user: { id: 1 },
        body: passwordData,
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.changePasswordController(mockReq, mockRes);

      expect(mockChangePassword).toHaveBeenCalledWith(
        1,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        "Senha alterada com sucesso!",
        {}
      );
      expect(result.success).toBe(true);
    });

    it("deve retornar erro 400 se faltar campos obrigatórios", async () => {
      const mockReq = {
        user: { id: 1 },
        body: {},
        ip: "127.0.0.1",
      };
      const mockRes = {};

      const result = await authController.changePasswordController(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Senha atual e nova senha são obrigatórias",
        400
      );
      expect(result.success).toBe(false);
    });
  });
});

