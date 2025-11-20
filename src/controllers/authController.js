import { registerUser, loginUser } from "../services/authService.js";
import logger from "../logger/logger.js";
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from "../utils/responseHelper.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import jwt from "jsonwebtoken";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return errorResponse(res, "Nome, e-mail e senha são obrigatórios", 400);
  }

  const user = await registerUser(name, email, password);
  
  // Gerar token após registro
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado no ambiente.");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  logger.info(`Novo usuário registrado: ${user.email}`);
  return createdResponse(res, "Usuário registrado com sucesso!", { user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return unauthorizedResponse(res, "E-mail e senha são obrigatórios");
  }

  const { user, token } = await loginUser(email, password);
  logger.info(`Login realizado: ${user.email}`);
  return successResponse(res, "Login realizado com sucesso!", { user, token });
});

