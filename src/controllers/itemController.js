import {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus,
  reserveItem,
  buyItem,
} from "../services/itemService.js";
import logger from "../logger/logger.js";
import { successResponse, createdResponse, errorResponse, notFoundResponse } from "../utils/responseHelper.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

export const create = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const item = await createItem(req.body, userId);
  logger.info(`Item criado: ${item.id} por usuário ${userId}`);
  return createdResponse(res, "Item criado com sucesso!", item);
});

export const getAll = asyncHandler(async (req, res) => {
  logger.debug({
    message: "Listando todos os itens",
    ip: req.ip,
  });
  
  const items = await getAllItems();
  
  logger.info({
    message: "Itens listados com sucesso",
    count: items.length,
  });
  
  return successResponse(res, "Itens listados com sucesso!", items);
});

export const getById = asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  
  logger.debug({
    message: "Buscando item por ID",
    itemId,
    ip: req.ip,
  });
  
  const item = await getItemById(itemId);
  
  if (!item) {
    logger.warn({
      message: "Item não encontrado",
      itemId,
    });
    return notFoundResponse(res, "Item não encontrado");
  }
  
  logger.info({
    message: "Item encontrado",
    itemId: item.id,
    title: item.title,
  });
  
  return successResponse(res, "Item encontrado!", item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  
  logger.info({
    message: "Atualizando item",
    itemId,
    userId,
    updates: Object.keys(req.body),
    ip: req.ip,
  });
  
  const item = await updateItem(itemId, req.body, userId);
  
  logger.info({
    message: "Item atualizado com sucesso",
    itemId: item.id,
    userId,
    title: item.title,
  });
  
  return successResponse(res, "Item atualizado com sucesso!", item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  
  logger.info({
    message: "Deletando item",
    itemId,
    userId,
    ip: req.ip,
  });
  
  const result = await deleteItem(itemId, userId);
  
  logger.info({
    message: "Item deletado com sucesso",
    itemId,
    userId,
  });
  
  return successResponse(res, result.message || "Item excluído com sucesso!");
});

export const updateStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return errorResponse(res, "Status é obrigatório", 400);
  }

  logger.info({
    message: "Atualizando status do item",
    itemId,
    userId,
    newStatus: status,
    ip: req.ip,
  });
  
  const item = await updateItemStatus(itemId, status, userId);
  
  logger.info({
    message: "Status do item atualizado com sucesso",
    itemId: item.id,
    userId,
    status: item.status,
  });
  
  return successResponse(res, "Status do item atualizado com sucesso!", item);
});

export const reserve = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  logger.info({
    message: "Reservando item",
    itemId,
    userId,
    ip: req.ip,
  });

  const item = await reserveItem(itemId, userId);

  logger.info({
    message: "Item reservado com sucesso",
    itemId: item.id,
    userId,
    title: item.title,
  });

  return successResponse(res, "Item reservado com sucesso!", item);
});

export const buy = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  logger.info({
    message: "Comprando item",
    itemId,
    userId,
    ip: req.ip,
  });

  const item = await buyItem(itemId, userId);

  logger.info({
    message: "Item comprado com sucesso",
    itemId: item.id,
    userId,
    title: item.title,
  });

  return successResponse(res, "Item comprado com sucesso!", item);
});
