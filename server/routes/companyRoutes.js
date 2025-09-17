import express from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById
} from "../controllers/companyController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, authorizeRoles("super_admin"), createCompany)
  .get(protect, authorizeRoles("super_admin"), getCompanies);

router.route("/:id")
  .get(protect, getCompanyById);

export default router;
