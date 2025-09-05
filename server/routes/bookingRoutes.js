import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getMyBookings,
  approveBooking,
  rejectBooking,
} from "../controllers/bookingController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createBooking)        // create booking
  .get(protect, admin, getBookings);   // admin: all bookings

router.get("/my", protect, getMyBookings); // logged-in agent bookings

router.route("/:id")
  .get(protect, getBookingById)   // Admin or owner
  .put(protect, updateBooking)    // Admin or owner
  .delete(protect, deleteBooking); // Admin or owner

// Admin approval routes
router.put("/:id/approve", protect, admin, approveBooking);
router.put("/:id/reject", protect, admin, rejectBooking);


export default router;
// server.js (routes mount ho jane ke BAAD ye lines add karein)