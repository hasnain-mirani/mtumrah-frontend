import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "agent"], default: "agent" },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    // Add company reference
    company: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company"
    },
    // For super admin - can access all companies
    canAccessAllCompanies: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.model("User", userSchema);
