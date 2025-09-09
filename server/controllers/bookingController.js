import Booking from "../models/Booking.js";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";
import { generateBookingPDF } from "../utils/pdfService.js";

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (logged-in user)
export const createBooking = async (req, res) => {
  try {
    const bookingData = {
      // Customer Information
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      contactNumber: req.body.contactNumber,
      passengers: req.body.passengers,
      adults: req.body.adults,
      children: req.body.children,
      
      // Package Information
      package: req.body.package,
      packagePrice: req.body.packagePrice,
      additionalServices: req.body.additionalServices,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod || 'credit_card',
      
      // Travel Dates
      date: req.body.date,
      departureDate: req.body.departureDate,
      returnDate: req.body.returnDate,
      
      // Flight Information
      flight: {
        departureCity: req.body.departureCity,
        arrivalCity: req.body.arrivalCity,
        flightClass: req.body.flightClass || 'economy'
      },
      
      // Hotel Information
      hotel: {
        hotelName: req.body.hotelName,
        roomType: req.body.roomType,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut
      },
      
      // Visa Information
      visa: {
        visaType: req.body.visaType || 'umrah',
        passportNumber: req.body.passportNumber,
        nationality: req.body.nationality
      },
      
      // Transport Information
      transport: {
        transportType: req.body.transportType || 'bus',
        pickupLocation: req.body.pickupLocation
      },
      
      // Payment Information
      payment: {
        cardNumber: req.body.cardNumber,
        expiryDate: req.body.expiryDate,
        cvv: req.body.cvv,
        cardholderName: req.body.cardholderName
      },
      
      // Agent and Grouping
      agent: req.user._id,
      customerGroup: req.body.customerEmail, // Use email for grouping
    };

              const booking = await Booking.create(bookingData);
          
          // Send confirmation email to customer
          try {
            await sendBookingConfirmationEmail({
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              package: booking.package,
              totalAmount: booking.totalAmount,
              departureDate: booking.departureDate,
              status: booking.status
            });
          } catch (emailError) {
            console.error('Failed to send booking confirmation email:', emailError);
            // Don't fail the booking creation if email fails
          }
          
          res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all bookings (admin only)
// @route   GET /api/bookings
// @access  Private/Admin
export const getBookings = async (req, res) => {
  const bookings = await Booking.find().populate("agent", "name email");
  res.json(bookings);
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (owner or admin)
export const getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("agent", "name email");
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.agent.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }
  res.json(booking);
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin or Owner Agent)
export const updateBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // ✅ RBAC Check
  if (req.user.role !== "admin" && booking.agent.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  booking.status = req.body.status || booking.status;
  booking.customerName = req.body.customerName || booking.customerName;
  booking.customerEmail = req.body.customerEmail || booking.customerEmail;

  // Handle approval status based on status change
  if (req.user.role === "admin") {
    if (req.body.status === "confirmed") {
      booking.approvalStatus = "approved";
      console.log(`Admin ${req.user._id} approved booking ${booking._id}`);
    } else if (req.body.status === "cancelled") {
      booking.approvalStatus = "rejected";
      console.log(`Admin ${req.user._id} rejected booking ${booking._id}`);
    } else if (req.body.status === "pending") {
      booking.approvalStatus = "pending";
      console.log(`Admin ${req.user._id} set booking ${booking._id} to pending`);
    }
  } else if (req.body.approvalStatus) {
    booking.approvalStatus = req.body.approvalStatus;
  }

  const updatedBooking = await booking.save();
  res.json(updatedBooking);
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin or Owner Agent)
export const deleteBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // ✅ RBAC Check
  if (req.user.role !== "admin" && booking.agent.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await booking.deleteOne();
  res.json({ message: "Booking removed" });
};

// @desc    Approve booking
// @route   PUT /api/bookings/:id/approve
// @access  Private (Admin only)
export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.approvalStatus = "approved";
    booking.status = "confirmed";
    const updatedBooking = await booking.save();
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject booking
// @route   PUT /api/bookings/:id/reject
// @access  Private (Admin only)
export const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.approvalStatus = "rejected";
    booking.status = "cancelled";
    const updatedBooking = await booking.save();
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ agent: req.user._id }).populate("agent", "name email");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Download booking PDF
// @route   GET /api/bookings/:id/pdf
// @access  Private (owner or admin)
export const downloadBookingPDF = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("agent", "name email");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check authorization
    const agentId = booking.agent ? booking.agent._id || booking.agent.toString() : null;
    if (agentId !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Generate PDF
    const pdfBuffer = await generateBookingPDF(booking);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-${booking._id || 'unknown'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};
