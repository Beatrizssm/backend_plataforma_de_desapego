import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateItemData,
  validateId,
} from "../../src/utils/validators.js";
import { AppError } from "../../src/middlewares/errorHandler.js";

describe("validators", () => {
  describe("validateEmail", () => {
    it("deve validar email válido", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("deve lançar erro se email estiver vazio", () => {
      expect(() => validateEmail("")).toThrow("E-mail é obrigatório");
      expect(() => validateEmail(null)).toThrow("E-mail é obrigatório");
      expect(() => validateEmail(undefined)).toThrow("E-mail é obrigatório");
    });

    it("deve lançar erro se email for inválido", () => {
      expect(() => validateEmail("invalid-email")).toThrow("E-mail inválido");
      expect(() => validateEmail("test@")).toThrow("E-mail inválido");
      expect(() => validateEmail("@example.com")).toThrow("E-mail inválido");
      expect(() => validateEmail("test.example.com")).toThrow("E-mail inválido");
    });
  });

  describe("validatePassword", () => {
    it("deve validar senha válida", () => {
      expect(validatePassword("password123")).toBe(true);
      expect(validatePassword("123456")).toBe(true);
    });

    it("deve lançar erro se senha estiver vazia", () => {
      expect(() => validatePassword("")).toThrow("Senha é obrigatória");
      expect(() => validatePassword(null)).toThrow("Senha é obrigatória");
      expect(() => validatePassword(undefined)).toThrow("Senha é obrigatória");
    });

    it("deve lançar erro se senha for muito curta", () => {
      expect(() => validatePassword("12345")).toThrow("Senha deve ter no mínimo 6 caracteres");
      expect(() => validatePassword("abc")).toThrow("Senha deve ter no mínimo 6 caracteres");
    });
  });

  describe("validateName", () => {
    it("deve validar nome válido", () => {
      expect(validateName("João")).toBe(true);
      expect(validateName("Maria Silva")).toBe(true);
    });

    it("deve lançar erro se nome estiver vazio", () => {
      expect(() => validateName("")).toThrow("Nome é obrigatório");
      expect(() => validateName(null)).toThrow("Nome é obrigatório");
      expect(() => validateName(undefined)).toThrow("Nome é obrigatório");
    });

    it("deve lançar erro se nome for muito curto", () => {
      expect(() => validateName("A")).toThrow("Nome deve ter no mínimo 2 caracteres");
      expect(() => validateName("  ")).toThrow("Nome deve ter no mínimo 2 caracteres");
    });
  });

  describe("validateItemData", () => {
    it("deve validar dados de item válidos", () => {
      const validData = {
        title: "Item Teste",
        description: "Descrição do item com mais de 10 caracteres",
        price: 99.99,
      };

      expect(validateItemData(validData)).toBe(true);
    });

    it("deve lançar erro se título estiver faltando", () => {
      const invalidData = {
        description: "Descrição válida com mais de 10 caracteres",
        price: 99.99,
      };

      expect(() => validateItemData(invalidData)).toThrow();
    });

    it("deve lançar erro se título for muito curto", () => {
      const invalidData = {
        title: "AB",
        description: "Descrição válida com mais de 10 caracteres",
        price: 99.99,
      };

      expect(() => validateItemData(invalidData)).toThrow("Título deve ter no mínimo 3 caracteres");
    });

    it("deve lançar erro se descrição estiver faltando", () => {
      const invalidData = {
        title: "Item Teste",
        price: 99.99,
      };

      expect(() => validateItemData(invalidData)).toThrow();
    });

    it("deve lançar erro se descrição for muito curta", () => {
      const invalidData = {
        title: "Item Teste",
        description: "Curta",
        price: 99.99,
      };

      expect(() => validateItemData(invalidData)).toThrow(
        "Descrição deve ter no mínimo 10 caracteres"
      );
    });

    it("deve lançar erro se preço estiver faltando", () => {
      const invalidData = {
        title: "Item Teste",
        description: "Descrição válida com mais de 10 caracteres",
      };

      expect(() => validateItemData(invalidData)).toThrow("Preço é obrigatório");
    });

    it("deve lançar erro se preço for negativo", () => {
      const invalidData = {
        title: "Item Teste",
        description: "Descrição válida com mais de 10 caracteres",
        price: -10,
      };

      expect(() => validateItemData(invalidData)).toThrow("Preço deve ser um número positivo");
    });

    it("deve lançar erro se preço não for um número", () => {
      const invalidData = {
        title: "Item Teste",
        description: "Descrição válida com mais de 10 caracteres",
        price: "not-a-number",
      };

      expect(() => validateItemData(invalidData)).toThrow("Preço deve ser um número positivo");
    });

    it("deve lançar múltiplos erros se houver vários problemas", () => {
      const invalidData = {
        title: "AB",
        description: "Curta",
        price: -10,
      };

      expect(() => validateItemData(invalidData)).toThrow();
      try {
        validateItemData(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.errors).toBeInstanceOf(Array);
        expect(error.errors.length).toBeGreaterThan(1);
      }
    });
  });

  describe("validateId", () => {
    it("deve validar ID válido", () => {
      expect(validateId(1)).toBe(1);
      expect(validateId("1")).toBe(1);
      expect(validateId(999)).toBe(999);
    });

    it("deve lançar erro se ID for inválido", () => {
      expect(() => validateId("invalid")).toThrow("ID inválido");
      expect(() => validateId(0)).toThrow("ID inválido");
      expect(() => validateId(-1)).toThrow("ID inválido");
      expect(() => validateId(1.5)).toThrow("ID inválido");
      expect(() => validateId(null)).toThrow("ID inválido");
      expect(() => validateId(undefined)).toThrow("ID inválido");
    });

    it("deve converter string para número", () => {
      expect(validateId("123")).toBe(123);
      expect(typeof validateId("123")).toBe("number");
    });
  });
});

