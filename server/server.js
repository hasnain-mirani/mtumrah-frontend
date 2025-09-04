import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import connectDB from "./config/db.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js"
import agentRoutes from "./routes/agentRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js";
// import pdfRoutes from "./routes/pdfRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();


// Security & Rate Limiting
app.use(helmet());

// Limit requests to avoid abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
});
app.use(limiter);

//  Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin.includes("vercel.app") || // ✅ allow any Vercel deployment
        origin === "http://localhost:5173"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.bgMagenta
      .white
  );
});
