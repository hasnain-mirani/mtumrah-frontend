import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    responder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    approved: { type: Boolean, default: false }, // admin approval
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    // Customer Information
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    
    // Status and Priority
    status: {
      type: String,
      enum: ["pending", "responded", "resolved", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    
    // Assignment and Response
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    responses: [responseSchema],
    
    // Related booking (if inquiry is about a specific booking)
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    
    // Admin approval for responses
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);
export default Inquiry;
