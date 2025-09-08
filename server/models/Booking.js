import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Customer Information
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    contactNumber: { type: String },
    passengers: { type: String },
    adults: { type: String },
    children: { type: String },
    
    // Package Information
    package: { type: String, required: true },
    packagePrice: { type: String },
    additionalServices: { type: String },
    totalAmount: { type: String },
    paymentMethod: { 
      type: String, 
      enum: ['credit_card', 'bank_transfer', 'cash', 'installments'],
      default: 'credit_card'
    },
    
    // Travel Dates
    date: { type: Date, required: true },
    departureDate: { type: Date },
    returnDate: { type: Date },
    
    // Flight Information
    flight: {
      departureCity: { type: String },
      arrivalCity: { type: String },
      flightClass: { 
        type: String, 
        enum: ['economy', 'business', 'first'],
        default: 'economy'
      }
    },
    
    // Hotel Information
    hotel: {
      hotelName: { type: String },
      roomType: { type: String },
      checkIn: { type: Date },
      checkOut: { type: Date }
    },
    
    // Visa Information
    visa: {
      visaType: { 
        type: String, 
        enum: ['umrah', 'hajj', 'tourist'],
        default: 'umrah'
      },
      passportNumber: { type: String },
      nationality: { type: String }
    },
    
    // Transport Information
    transport: {
      transportType: { 
        type: String, 
        enum: ['bus', 'car', 'van', 'taxi'],
        default: 'bus'
      },
      pickupLocation: { type: String }
    },
    
    // Payment Information
    payment: {
      cardNumber: { type: String },
      expiryDate: { type: String },
      cvv: { type: String },
      cardholderName: { type: String }
    },
    
    // Status and Approval
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "cancelled"], 
      default: "pending" 
    },
    approvalStatus: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    
    // Agent Information
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    
    // Customer Grouping (for multiple bookings from same customer)
    customerGroup: { type: String }, // Will be set to customerEmail for grouping
  },
  { timestamps: true }
);

// Index for customer grouping
bookingSchema.index({ customerEmail: 1 });
bookingSchema.index({ customerGroup: 1 });

export default mongoose.model("Booking", bookingSchema);
