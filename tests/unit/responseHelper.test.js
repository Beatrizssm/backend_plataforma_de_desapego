import { describe, it, expect, vi } from "vitest";
import {
  successResponse,
  errorResponse,
  createdResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "../../src/utils/responseHelper.js";

describe("responseHelper", () => {
  describe("successResponse", () => {
    it("deve retornar resposta de sucesso com dados", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const data = { id: 1, name: "Test" };
      successResponse(mockRes, "Sucesso!", data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Sucesso!",
        data,
      });
    });

    it("deve retornar resposta de sucesso sem dados", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      successResponse(mockRes, "Sucesso!");

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Sucesso!",
      });
    });

    it("deve aceitar status code customizado", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      successResponse(mockRes, "Sucesso!", null, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("não deve incluir data se for null", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      successResponse(mockRes, "Sucesso!", null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Sucesso!",
      });
    });

    it("não deve incluir data se for undefined", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      successResponse(mockRes, "Sucesso!", undefined);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Sucesso!",
      });
    });
  });

  describe("errorResponse", () => {
    it("deve retornar resposta de erro", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      errorResponse(mockRes, "Erro ocorreu", 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro ocorreu",
      });
    });

    it("deve usar status 400 como padrão", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      errorResponse(mockRes, "Erro ocorreu");

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("deve incluir erros de validação se fornecidos", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const errors = ["Erro 1", "Erro 2"];
      errorResponse(mockRes, "Erro de validação", 400, errors);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro de validação",
        errors,
      });
    });
  });

  describe("createdResponse", () => {
    it("deve retornar resposta 201 com dados", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const data = { id: 1, name: "Created" };
      createdResponse(mockRes, "Criado com sucesso!", data);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Criado com sucesso!",
        data,
      });
    });
  });

  describe("notFoundResponse", () => {
    it("deve retornar resposta 404", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      notFoundResponse(mockRes, "Recurso não encontrado");

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Recurso não encontrado",
      });
    });

    it("deve usar mensagem padrão se não fornecida", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      notFoundResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Recurso não encontrado",
      });
    });
  });

  describe("unauthorizedResponse", () => {
    it("deve retornar resposta 401", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      unauthorizedResponse(mockRes, "Não autorizado");

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Não autorizado",
      });
    });

    it("deve usar mensagem padrão se não fornecida", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      unauthorizedResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Não autorizado",
      });
    });
  });

  describe("forbiddenResponse", () => {
    it("deve retornar resposta 403", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      forbiddenResponse(mockRes, "Acesso negado");

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
      });
    });

    it("deve usar mensagem padrão se não fornecida", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      forbiddenResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
      });
    });
  });
});

