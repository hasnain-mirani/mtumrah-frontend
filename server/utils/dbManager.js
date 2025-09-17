import mongoose from 'mongoose';
import Company from '../models/Company.js';

// Store active connections
const companyConnections = new Map();

// Get company-specific database connection
export const getCompanyConnection = async (companyId) => {
  try {
    // If connection already exists, return it
    if (companyConnections.has(companyId)) {
      return companyConnections.get(companyId);
    }

    // Get company details
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Create new connection for this company
    const connection = mongoose.createConnection(company.databaseConfig.uri, {
      dbName: company.databaseConfig.dbName
    });

    // Store the connection
    companyConnections.set(companyId, connection);
    
    return connection;
  } catch (error) {
    console.error('Error creating company connection:', error);
    throw error;
  }
};

// Get company models (User, Agent, Booking, Inquiry) for specific company
export const getCompanyModels = async (companyId) => {
  const connection = await getCompanyConnection(companyId);
  
  // Define schemas for company-specific models
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "agent"], default: "agent" },
    phone: { type: String },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  const agentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    performance: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0 }
    }
  }, { timestamps: true });

  const bookingSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    contactNumber: { type: String },
    passengers: { type: String },
    adults: { type: String },
    children: { type: String },
    package: { type: String, required: true },
    packagePrice: { type: String },
    additionalServices: { type: String },
    totalAmount: { type: String },
    paymentMethod: { 
      type: String, 
      enum: ['credit_card', 'bank_transfer', 'cash', 'installments'],
      default: 'credit_card'
    },
    date: { type: Date, required: true },
    departureDate: { type: Date },
    returnDate: { type: Date },
    flight: {
      departureCity: { type: String },
      arrivalCity: { type: String },
      flightClass: { 
        type: String, 
        enum: ['economy', 'business', 'first'],
        default: 'economy'
      }
    },
    hotel: {
      hotelName: { type: String },
      roomType: { type: String },
      checkIn: { type: Date },
      checkOut: { type: Date }
    },
    visa: {
      visaType: { 
        type: String, 
        enum: ['umrah', 'hajj', 'tourist'],
        default: 'umrah'
      },
      passportNumber: { type: String },
      nationality: { type: String }
    },
    transport: {
      transportType: { 
        type: String, 
        enum: ['bus', 'car', 'van', 'taxi'],
        default: 'bus'
      },
      pickupLocation: { type: String }
    },
    payment: {
      cardNumber: { type: String },
      expiryDate: { type: String },
      cvv: { type: String },
      cardholderName: { type: String }
    },
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
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    customerGroup: { type: String }
  }, { timestamps: true });

  const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'responded', 'closed'], 
      default: 'pending' 
    },
    response: { type: String },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    approvalStatus: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    }
  }, { timestamps: true });

  // Return models for this company's database
  return {
    User: connection.model('User', userSchema),
    Agent: connection.model('Agent', agentSchema),
    Booking: connection.model('Booking', bookingSchema),
    Inquiry: connection.model('Inquiry', inquirySchema)
  };
};
