import { describe, it, expect, beforeEach, vi } from "vitest";
import { errorHandler, asyncHandler, AppError } from "../../src/middlewares/errorHandler.js";
import logger from "../../src/logger/logger.js";

// Mock do logger
vi.mock("../../src/logger/logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("deve tratar erro padrão com status 500", () => {
    const err = new Error("Erro genérico");
    const mockReq = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro genérico",
      stack: err.stack,
    });
  });

  it("deve tratar AppError com status code customizado", () => {
    const err = new AppError("Recurso não encontrado", 404);
    const mockReq = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Recurso não encontrado",
      stack: err.stack,
    });
  });

  it("deve incluir erros de validação na resposta", () => {
    const validationErrors = ["Campo obrigatório", "Formato inválido"];
    const err = new AppError("Erro de validação", 400, validationErrors);
    const mockReq = {
      method: "POST",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro de validação",
      errors: validationErrors,
      stack: err.stack,
    });
  });

  it("deve ocultar stack em produção", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Erro interno");
    const mockReq = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

    const callArgs = mockRes.json.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("stack");
  });

  it("deve ocultar mensagem detalhada de erro 500 em produção", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Detalhes internos do erro");
    err.statusCode = 500;
    const mockReq = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro interno do servidor",
    });
  });

  it("deve incluir informações do usuário no log se disponível", () => {
    const err = new Error("Erro de teste");
    const mockReq = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      user: { id: 1, email: "test@example.com" },
      get: vi.fn(() => "test-agent"),
      body: {},
      params: {},
      query: {},
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
      })
    );
  });
});

describe("asyncHandler", () => {
  it("deve executar função assíncrona com sucesso", async () => {
    const asyncFn = vi.fn().mockResolvedValue("success");
    const handler = asyncHandler(asyncFn);
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();

    await handler(mockReq, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve capturar erro e passar para next", async () => {
    const error = new Error("Erro de teste");
    const asyncFn = vi.fn().mockRejectedValue(error);
    const handler = asyncHandler(asyncFn);
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();

    await handler(mockReq, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe("AppError", () => {
  it("deve criar erro com mensagem e status code", () => {
    const error = new AppError("Erro de teste", 400);

    expect(error.message).toBe("Erro de teste");
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it("deve criar erro com erros de validação", () => {
    const validationErrors = ["Erro 1", "Erro 2"];
    const error = new AppError("Erro de validação", 400, validationErrors);

    expect(error.errors).toEqual(validationErrors);
  });

  it("deve usar status 500 como padrão", () => {
    const error = new AppError("Erro genérico");

    expect(error.statusCode).toBe(500);
    expect(error.status).toBe(500);
  });
});

