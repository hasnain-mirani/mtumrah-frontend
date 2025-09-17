import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    slug: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    primaryColor: { 
      type: String, 
      default: '#3B82F6' 
    },
    contactInfo: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }
    },
    // Database connection details for this company
    databaseConfig: {
      uri: { type: String, required: true },
      dbName: { type: String, required: true }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Create slug from name
companySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.model("Company", companySchema);
