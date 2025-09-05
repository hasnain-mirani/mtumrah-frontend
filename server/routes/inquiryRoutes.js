import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  addResponse,
  deleteInquiry,
  approveInquiry,
  rejectInquiry,
} from "../controllers/inquiryController.js";

const router = express.Router();

// Public route for creating inquiries (no auth required)
router.post("/", createInquiry);

// Public route for creating inquiries (alternative)
router.post("/public", createInquiry);

// Role-based access
router.get("/", protect, getInquiries);
router.get("/:id", protect, getInquiryById);
router.put("/:id", protect, updateInquiry);
router.post("/:id/respond", protect, addResponse);
router.delete("/:id", protect, authorizeRoles("admin"), deleteInquiry);

// Admin approval routes
router.put("/:id/approve", protect, authorizeRoles("admin"), approveInquiry);
router.put("/:id/reject", protect, authorizeRoles("admin"), rejectInquiry);

export default router;
