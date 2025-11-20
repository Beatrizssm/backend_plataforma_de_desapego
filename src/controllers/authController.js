import { registerUser, loginUser } from "../services/authService.js";
import logger from "../logger/logger.js";
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from "../utils/responseHelper.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import jwt from "jsonwebtoken";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  logger.debug({
    message: "Tentativa de registro",
    email,
    ip: req.ip,
  });

  if (!name || !email || !password) {
    logger.warn({
      message: "Tentativa de registro com campos faltando",
      email,
      ip: req.ip,
    });
    return errorResponse(res, "Nome, e-mail e senha são obrigatórios", 400);
  }

  const user = await registerUser(name, email, password);
  
  // Gerar token após registro
  if (!process.env.JWT_SECRET) {
    logger.error({
      message: "JWT_SECRET não configurado",
    });
    throw new Error("JWT_SECRET não configurado no ambiente.");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  logger.info({
    message: "Novo usuário registrado com sucesso",
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });
  
  return createdResponse(res, "Usuário registrado com sucesso!", { user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.debug({
    message: "Tentativa de login",
    email,
    ip: req.ip,
  });

  if (!email || !password) {
    logger.warn({
      message: "Tentativa de login sem credenciais",
      email,
      ip: req.ip,
    });
    return unauthorizedResponse(res, "E-mail e senha são obrigatórios");
  }

  const { user, token } = await loginUser(email, password);
  
  logger.info({
    message: "Login realizado com sucesso",
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });
  
  return successResponse(res, "Login realizado com sucesso!", { user, token });
});

