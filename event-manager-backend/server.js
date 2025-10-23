// ==========================
// server.js
// Event Logger Backend
// ==========================

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import eventRoutes from "./routes/events.js";

// Load environment variables (for safety)
dotenv.config();

const app = express();

// Port configuration
const PORT = process.env.PORT || 5000;

// Render automatically provides this variable
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// MongoDB URI (use .env for security)
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://geddanarendra2_db_user:jagan1234@cluster0.yuwrp2i.mongodb.net/eventlogger?retryWrites=true&w=majority";

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// MongoDB Connection
// ==========================
console.log("🔗 Connecting to MongoDB at:", MONGODB_URI);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB");
    console.log("📊 Database: eventlogger");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  });

// ==========================
// Routes
// ==========================
app.use("/api/events", eventRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🎉 Event Manager API is running!",
    base_url: BASE_URL,
    database: "MongoDB (Atlas)",
    endpoints: {
      events: "/api/events",
      health: "/api/health",
    },
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "OK",
    database: dbStatus,
    base_url: BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// Start Server
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running at: ${BASE_URL}`);
  console.log(`📋 Health Check: ${BASE_URL}/api/health`);
});
