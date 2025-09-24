import express from "express";
import dotenv from "dotenv";
import cors from "cors";
 import { protect } from "./middleware/authMiddleware.js";

// Load environment variables
import bookingRoutes from "./routes/bookingRoutes.js";
// import inquiriesRoutes from "./routes/inquiries.js";
dotenv.config();
import morgan from "morgan";
import colors from "colors";
import connectDB from "./config/db.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";

import inquiryRoutes from "./routes/inquiryRoutes.js"
import agentRoutes from "./routes/agentRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
// import pdfRoutes from "./routes/pdfRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import { ensureCompany } from "./middleware/companyContext.js";

// ...


dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();


// Security & Rate Limiting
app.use(helmet());

// Limit requests to avoid abuse (disabled for development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests in production
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

//  Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://mtumrah-portal.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Handle preflight requests
app.options('*', (req, res) => {
  console.log('🔧 CORS Preflight request from:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  console.log('🌐 Request from origin:', req.headers.origin);
  // Allow localhost for development
  const allowedOrigins = [
    'https://mtumrah-portal.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Create default admin if none exists
const createDefaultAdmin = async () => {
    try {
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
  
        await User.create({
            name: "Admin User",
        email: "admin@example.com",
        passwordHash: hashedPassword,
        role: "admin",
      });

      console.log(
        "Default admin created → email: admin@example.com | password: admin123"
      );
    } else {
      console.log("ℹAdmin already exists, skipping...");
    }
  } catch (error) {
      console.error("Error creating default admin:", error.message);
  }
};

// Call after DB connection
await createDefaultAdmin();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/agent', agentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/companies", companyRoutes);

app.use("/api/bookings",   protect, ensureCompany(true), bookingRoutes);
app.use("/api/inquiries",  protect, ensureCompany(true), inquiryRoutes)


// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API is running...",
    environment: process.env.NODE_ENV,
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// ===== Start Server =====
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.bgMagenta
      .white
  );
});
