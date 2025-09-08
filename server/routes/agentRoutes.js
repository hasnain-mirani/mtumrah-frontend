import express from "express";
import {
  registerAgent,
  loginAgent,
  getAgents,
  getAgentById,
  getMeAgent,
  updateAgent,
  deleteAgent,
  updateAgentPerformance,
  getAgentPerformance,
  getAgentsWithPerformance,
} from "../controllers/agentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Specific routes first (before dynamic ones)
router.post("/register", protect, admin, registerAgent);
router.post("/login", loginAgent);
router.get("/me", protect, getMeAgent);

// Performance routes (must be before /:id routes)
router.get("/performance", protect, admin, getAgentsWithPerformance);
router.get("/:id/performance", protect, getAgentPerformance);
router.put("/:id/performance", protect, updateAgentPerformance);

// List all agents (admin only)
router.get("/", protect, admin, getAgents);

// Dynamic routes last
router.route("/:id")
  .get(protect, getAgentById)
  .put(protect, updateAgent)
  .delete(protect, admin, deleteAgent);

export default router;
