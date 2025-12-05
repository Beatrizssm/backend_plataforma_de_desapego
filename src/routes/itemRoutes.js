import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { create, getAll, getById, update, remove, updateStatus, reserve, buy } from "../controllers/itemController.js";

const router = Router();

// Rotas públicas
router.get("/", getAll);
router.get("/:id", getById);

// Rotas protegidas
router.post("/", authenticateToken, create);
router.put("/:id", authenticateToken, update);
router.patch("/:id/status", authenticateToken, updateStatus);
router.post("/:id/reserve", authenticateToken, reserve);
router.post("/:id/buy", authenticateToken, buy);
router.delete("/:id", authenticateToken, remove);

export default router;
