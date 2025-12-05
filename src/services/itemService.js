import prisma from "../prisma/client.js";
import { validateItemData, validateId } from "../utils/validators.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../logger/logger.js";

// Validação de transições de status válidas
const VALID_STATUS_TRANSITIONS = {
  DISPONIVEL: ["RESERVADO", "DOADO_VENDIDO"],
  RESERVADO: ["DISPONIVEL", "DOADO_VENDIDO"],
  DOADO_VENDIDO: [], // Status final, não pode mudar
};

function isValidStatusTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) {
    return true; // Permite manter o mesmo status
  }
  
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

export async function createItem(data, userId) {
  validateId(userId);
  validateItemData(data);

  logger.debug({
    message: "Criando novo item",
    userId,
    title: data.title,
  });

  const item = await prisma.item.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      price: Number(data.price),
      available: data.available !== undefined ? Boolean(data.available) : true,
      status: data.status || "DISPONIVEL",
      imageUrl: data.imageUrl ? data.imageUrl.trim() : null,
      ownerId: userId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info({
    message: "Item criado com sucesso",
    itemId: item.id,
    userId,
    title: item.title,
  });

  return item;
}

export async function getAllItems() {
  logger.debug({ message: "Buscando todos os itens" });
  
  const items = await prisma.item.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: {
      createdAt: "desc",
    },
  });

  logger.debug({
    message: "Itens recuperados",
    count: items.length,
  });

  return items;
}

export async function getItemById(id) {
  const itemId = validateId(id);
  
  logger.debug({
    message: "Buscando item por ID",
    itemId,
  });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!item) {
    logger.warn({
      message: "Item não encontrado",
      itemId,
    });
  } else {
    logger.debug({
      message: "Item encontrado",
      itemId,
      title: item.title,
    });
  }

  return item;
}

export async function updateItem(id, data, userId) {
  const itemId = validateId(id);
  validateId(userId);

  logger.debug({
    message: "Atualizando item",
    itemId,
    userId,
    updates: Object.keys(data),
  });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    logger.warn({
      message: "Tentativa de atualizar item inexistente",
      itemId,
      userId,
    });
    throw new AppError("Item não encontrado", 404);
  }
  if (item.ownerId !== userId) {
    logger.warn({
      message: "Tentativa de atualizar item de outro usuário",
      itemId,
      itemOwnerId: item.ownerId,
      userId,
    });
    throw new AppError("Acesso negado. Você não é o dono deste item.", 403);
  }

  // Validar dados se fornecidos
  if (data.title !== undefined && data.title.trim().length < 3) {
    throw new AppError("Título deve ter no mínimo 3 caracteres", 400);
  }
  if (data.description !== undefined && data.description.trim().length < 10) {
    throw new AppError("Descrição deve ter no mínimo 10 caracteres", 400);
  }
  if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
    throw new AppError("Preço deve ser um número positivo", 400);
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.available !== undefined) updateData.available = Boolean(data.available);
  if (data.status !== undefined) {
    const validStatuses = ["DISPONIVEL", "RESERVADO", "DOADO_VENDIDO"];
    if (!validStatuses.includes(data.status)) {
      throw new AppError("Status inválido. Use: DISPONIVEL, RESERVADO ou DOADO_VENDIDO", 400);
    }
    
    // Validar transição de status
    if (!isValidStatusTransition(item.status, data.status)) {
      throw new AppError(
        `Transição de status inválida. Não é possível mudar de ${item.status} para ${data.status}`,
        400
      );
    }
    
    updateData.status = data.status;
    // Atualizar available baseado no status
    updateData.available = data.status === "DISPONIVEL";
  }
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: updateData,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info({
    message: "Item atualizado com sucesso",
    itemId,
    userId,
    title: updatedItem.title,
  });

  return updatedItem;
}

export async function deleteItem(id, userId) {
  const itemId = validateId(id);
  validateId(userId);

  logger.debug({
    message: "Deletando item",
    itemId,
    userId,
  });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    logger.warn({
      message: "Tentativa de deletar item inexistente",
      itemId,
      userId,
    });
    throw new AppError("Item não encontrado", 404);
  }
  if (item.ownerId !== userId) {
    logger.warn({
      message: "Tentativa de deletar item de outro usuário",
      itemId,
      itemOwnerId: item.ownerId,
      userId,
    });
    throw new AppError("Acesso negado. Você não é o dono deste item.", 403);
  }

  await prisma.item.delete({ where: { id: itemId } });
  
  logger.info({
    message: "Item deletado com sucesso",
    itemId,
    userId,
    title: item.title,
  });

  return { message: "Item excluído com sucesso!" };
}

/**
 * Reserva um item disponível (qualquer usuário autenticado pode reservar)
 */
export async function reserveItem(id, userId) {
  const itemId = validateId(id);
  validateId(userId);

  logger.debug({
    message: "Reservando item",
    itemId,
    userId,
  });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    logger.warn({
      message: "Tentativa de reservar item inexistente",
      itemId,
      userId,
    });
    throw new AppError("Item não encontrado", 404);
  }

  // Verificar se o item está disponível
  if (item.status !== "DISPONIVEL") {
    logger.warn({
      message: "Tentativa de reservar item não disponível",
      itemId,
      currentStatus: item.status,
      userId,
    });
    throw new AppError("Este item não está disponível para reserva", 400);
  }

  // Verificar se o usuário não é o dono (não pode reservar seu próprio item)
  if (item.ownerId === userId) {
    logger.warn({
      message: "Tentativa de reservar próprio item",
      itemId,
      userId,
    });
    throw new AppError("Você não pode reservar seu próprio item", 400);
  }

  // Atualizar status para RESERVADO
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      status: "RESERVADO",
      available: false,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info({
    message: "Item reservado com sucesso",
    itemId,
    userId,
    title: updatedItem.title,
  });

  return updatedItem;
}

/**
 * Compra um item disponível ou reservado (qualquer usuário autenticado pode comprar)
 */
export async function buyItem(id, userId) {
  const itemId = validateId(id);
  validateId(userId);

  logger.debug({
    message: "Comprando item",
    itemId,
    userId,
  });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    logger.warn({
      message: "Tentativa de comprar item inexistente",
      itemId,
      userId,
    });
    throw new AppError("Item não encontrado", 404);
  }

  // Verificar se o item está disponível ou reservado
  if (item.status !== "DISPONIVEL" && item.status !== "RESERVADO") {
    logger.warn({
      message: "Tentativa de comprar item não disponível",
      itemId,
      currentStatus: item.status,
      userId,
    });
    throw new AppError("Este item não está disponível para compra", 400);
  }

  // Verificar se o usuário não é o dono (não pode comprar seu próprio item)
  if (item.ownerId === userId) {
    logger.warn({
      message: "Tentativa de comprar próprio item",
      itemId,
      userId,
    });
    throw new AppError("Você não pode comprar seu próprio item", 400);
  }

  // Atualizar status para DOADO_VENDIDO
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      status: "DOADO_VENDIDO",
      available: false,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info({
    message: "Item comprado com sucesso",
    itemId,
    userId,
    title: updatedItem.title,
  });

  return updatedItem;
}

/**
 * Atualiza o status de um item com validação de transições (apenas o dono pode alterar)
 */
export async function updateItemStatus(id, newStatus, userId) {
  const itemId = validateId(id);
  validateId(userId);

  // Validar status
  const validStatuses = ["DISPONIVEL", "RESERVADO", "DOADO_VENDIDO"];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError("Status inválido. Use: DISPONIVEL, RESERVADO ou DOADO_VENDIDO", 400);
  }

  logger.debug({
    message: "Atualizando status do item",
    itemId,
    userId,
    newStatus,
  });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    logger.warn({
      message: "Tentativa de atualizar status de item inexistente",
      itemId,
      userId,
    });
    throw new AppError("Item não encontrado", 404);
  }

  if (item.ownerId !== userId) {
    logger.warn({
      message: "Tentativa de atualizar status de item de outro usuário",
      itemId,
      itemOwnerId: item.ownerId,
      userId,
    });
    throw new AppError("Acesso negado. Você não é o dono deste item.", 403);
  }

  // Validar transição de status
  if (!isValidStatusTransition(item.status, newStatus)) {
    logger.warn({
      message: "Tentativa de transição de status inválida",
      itemId,
      currentStatus: item.status,
      newStatus,
      userId,
    });
    throw new AppError(
      `Transição de status inválida. Não é possível mudar de ${item.status} para ${newStatus}`,
      400
    );
  }

  // Atualizar status e available
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      status: newStatus,
      available: newStatus === "DISPONIVEL", // Disponível apenas se status for DISPONIVEL
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info({
    message: "Status do item atualizado com sucesso",
    itemId,
    userId,
    oldStatus: item.status,
    newStatus: updatedItem.status,
    title: updatedItem.title,
  });

  return updatedItem;
}
