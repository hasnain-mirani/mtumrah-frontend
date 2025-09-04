import express from "express";
import { loginUser, registerUser, logoutUser, getMeUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { permit } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
// router.post("/register", registerUser);

// Only admins can register new users
router.post("/register", protect, permit("admin"), registerUser);

router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMeUser);

export default router;
