import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const agentSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "agent" },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    
    // Performance tracking fields
    monthlyTarget: { type: Number, default: 5000 },
    commissionRate: { type: Number, default: 5.0, min: 0, max: 100 },
    
    // Performance statistics (calculated from bookings)
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    monthlyBookings: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    
    // Additional fields
    department: { type: String, enum: ['sales', 'customer_service', 'operations', 'marketing'], default: 'sales' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Password hashing middleware
agentSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
agentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;