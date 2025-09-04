import express from "express";
import {
  registerAgent,
  loginAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} from "../controllers/agentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Specific first
router.post("/register", protect, admin, registerAgent);
router.post("/login", loginAgent);

// Then dynamic ones
router.route("/:id")
  .get(protect, getAgentById)
  .put(protect, updateAgent)
  .delete(protect, admin, deleteAgent);

// List all agents (admin only)
router.get("/", protect, admin, getAgents);


export default router;
