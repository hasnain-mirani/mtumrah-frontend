// controllers/bookingController.js
import Joi from "joi";
import { getCompanyModels } from "../utils/dbManager.js";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";
import { generateBookingPDF } from "../utils/pdfService.js";

/* ----------------------------- helpers ----------------------------- */
const getId = (v) => (v && v._id ? v._id.toString() : v?.toString?.());
const isOwnerOrAdmin = (booking, user) =>
  getId(booking.agent) === user._id.toString() || user.role === "admin";

// Accept company from header, query, or JWT user
const getCompanyIdFromReq = (req) =>
  req.headers["x-company-id"] ||
  req.query.companyId ||
  req.user?.company?._id ||
  req.user?.company;

const requireCompany = (req, res) => {
  const companyId = getCompanyIdFromReq(req);
  if (!companyId) {
    res.status(400).json({
      message:
        "Company context missing. Include 'x-company-id' header or ensure req.user.company is populated.",
    });
    return null;
  }
  return companyId;
};

const createBookingSchema = Joi.object({
  // Customer
  customerName: Joi.string().min(2).required(),
  customerEmail: Joi.string().email().required(),
  contactNumber: Joi.string().min(6).required(),
  passengers: Joi.number().integer().min(1).required(),
  adults: Joi.number().integer().min(0).required(),
  children: Joi.number().integer().min(0).required(),

  // Package
  package: Joi.string().min(1).required(),
  packagePrice: Joi.number().min(0).required(),
  additionalServices: Joi.array().items(Joi.string()).default([]),
  totalAmount: Joi.number().min(0).required(),
  paymentMethod: Joi.string()
    .valid("credit_card", "cash", "bank_transfer")
    .default("credit_card"),

  // Dates
  date: Joi.date().required(),
  departureDate: Joi.date().required(),
  returnDate: Joi.date().greater(Joi.ref("departureDate")).required(),

  // Flight
  departureCity: Joi.string().allow("", null),
  arrivalCity: Joi.string().allow("", null),
  flightClass: Joi.string()
    .valid("economy", "business", "first")
    .default("economy"),

  // Hotel
  hotelName: Joi.string().allow("", null),
  roomType: Joi.string().allow("", null),
  checkIn: Joi.date().allow("", null),
  checkOut: Joi.date().allow("", null),

  // Visa
  visaType: Joi.string().default("umrah"),
  passportNumber: Joi.string().allow("", null),
  nationality: Joi.string().allow("", null),

  // Transport
  transportType: Joi.string()
    .valid("bus", "car", "van", "private")
    .default("bus"),
  pickupLocation: Joi.string().allow("", null),

  // Payment from UI (sanitized below)
  cardNumber: Joi.string().allow("", null),
  expiryDate: Joi.string().allow("", null),
  cvv: Joi.string().allow("", null),
  cardholderName: Joi.string().allow("", null),
}).custom((value, helpers) => {
  if (value.passengers !== value.adults + value.children) {
    return helpers.error("any.invalid", {
      message: "passengers must equal adults + children",
    });
  }
  return value;
}, "passenger consistency");

const updateBookingSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "cancelled").optional(),
  approvalStatus: Joi.string()
    .valid("pending", "approved", "rejected")
    .optional(),
  customerName: Joi.string().min(2).optional(),
  customerEmail: Joi.string().email().optional(),
}).min(1);

const validate = (schema, payload) => {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details?.map((d) => d.message) ?? [error.message];
    const err = new Error("Validation failed");
    err.status = 400;
    err.details = details;
    throw err;
  }
  return value;
};

/* ----------------------------- controllers ----------------------------- */

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (logged-in user)
export const createBooking = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const v = validate(createBookingSchema, req.body);

    // sanitize payment (do NOT store full PAN or CVV)
    const payment = {
      method: v.paymentMethod || "credit_card",
      cardLast4: v.cardNumber ? String(v.cardNumber).slice(-4) : undefined,
      cardholderName: v.cardholderName || undefined,
      expiryDate: v.expiryDate || undefined,
    };

    const bookingData = {
      // Customer
      customerName: v.customerName,
      customerEmail: v.customerEmail,
      contactNumber: v.contactNumber,
      passengers: v.passengers,
      adults: v.adults,
      children: v.children,

      // Package
      package: v.package,
      packagePrice: v.packagePrice,
      additionalServices: v.additionalServices ?? [],
      totalAmount: v.totalAmount,
      paymentMethod: v.paymentMethod || "credit_card",

      // Dates
      date: v.date,
      departureDate: v.departureDate,
      returnDate: v.returnDate,

      // Flight
      flight: {
        departureCity: v.departureCity || "",
        arrivalCity: v.arrivalCity || "",
        flightClass: v.flightClass || "economy",
      },

      // Hotel
      hotel: {
        hotelName: v.hotelName || "",
        roomType: v.roomType || "",
        checkIn: v.checkIn || null,
        checkOut: v.checkOut || null,
      },

      // Visa
      visa: {
        visaType: v.visaType || "umrah",
        passportNumber: v.passportNumber || "",
        nationality: v.nationality || "",
      },

      // Transport
      transport: {
        transportType: v.transportType || "bus",
        pickupLocation: v.pickupLocation || "",
      },

      // Payment (sanitized)
      payment,

      // Agent + grouping
      agent: req.user._id,
      customerGroup: v.customerEmail,

      // Defaults
      status: "pending",
      approvalStatus: "pending",
    };

    const booking = await CompanyBooking.create(bookingData);

    // email (non-blocking)
    try {
      await sendBookingConfirmationEmail({
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        package: booking.package,
        totalAmount: booking.totalAmount,
        departureDate: booking.departureDate,
        status: booking.status,
      });
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(error.status || 400).json({
      message: error.message || "Failed to create booking",
      ...(error.details ? { details: error.details } : {}),
    });
  }
};

// @desc    Get all bookings (admin only)
// @route   GET /api/bookings
// @access  Private/Admin
export const getBookings = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);

    // Optional filters: ?status=&agent=
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.agent) q.agent = req.query.agent;

    const bookings = await CompanyBooking.find(q)
      .populate("agent", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("getBookings error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (owner or admin)
export const getBookingById = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id).populate(
      "agent",
      "name email"
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!isOwnerOrAdmin(booking, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(booking);
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin or Owner Agent)
export const updateBooking = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!isOwnerOrAdmin(booking, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const v = validate(updateBookingSchema, req.body);

    if (typeof v.customerName !== "undefined")
      booking.customerName = v.customerName;
    if (typeof v.customerEmail !== "undefined")
      booking.customerEmail = v.customerEmail;

    if (req.user.role === "admin") {
      if (v.status === "confirmed") booking.approvalStatus = "approved";
      if (v.status === "cancelled") booking.approvalStatus = "rejected";
      if (v.status === "pending") booking.approvalStatus = "pending";
    }
    if (typeof v.status !== "undefined") booking.status = v.status;
    if (typeof v.approvalStatus !== "undefined" && req.user.role !== "admin") {
      booking.approvalStatus = v.approvalStatus;
    }

    const updated = await booking.save();
    res.json(updated);
  } catch (error) {
    console.error("updateBooking error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Server error",
      ...(error.details ? { details: error.details } : {}),
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin or Owner Agent)
export const deleteBooking = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!isOwnerOrAdmin(booking, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await booking.deleteOne();
    res.json({ message: "Booking removed" });
  } catch (error) {
    console.error("deleteBooking error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Approve booking
// @route   PUT /api/bookings/:id/approve
// @access  Private (Admin only)
export const approveBooking = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.approvalStatus = "approved";
    booking.status = "confirmed";
    const updated = await booking.save();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("approveBooking error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// @desc    Reject booking
// @route   PUT /api/bookings/:id/reject
// @access  Private (Admin only)
export const rejectBooking = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.approvalStatus = "rejected";
    booking.status = "cancelled";
    const updated = await booking.save();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("rejectBooking error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// @desc    Get logged-in user bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const bookings = await CompanyBooking.find({ agent: req.user._id })
      .populate("agent", "name email")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Download booking PDF
// @route   GET /api/bookings/:id/pdf
// @access  Private (owner or admin)
export const downloadBookingPDF = async (req, res) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { Booking: CompanyBooking } = await getCompanyModels(companyId);
    const booking = await CompanyBooking.findById(req.params.id).populate(
      "agent",
      "name email"
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!isOwnerOrAdmin(booking, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const pdfBuffer = await generateBookingPDF(
      booking,
      // Pass company object if your PDF needs it; fallback to minimal context
      req.user.company || { _id: companyId }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="booking-${booking._id || "unknown"}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};
