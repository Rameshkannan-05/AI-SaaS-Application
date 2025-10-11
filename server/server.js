import express from "express";
import cors from "cors";
import "dotenv/config"; // load environment variables from .env
import { clerkMiddleware, requireAuth } from "@clerk/express"; // authentication
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

// Connect to Cloudinary (for image storage & processing)
await connectCloudinary();

// Server port
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON bodies
app.use(clerkMiddleware());
// clerkMiddleware adds Auth object to each request
// e.g., req.auth() can be used to get user data

// Root route (test server status)
app.get("/", (req, res) => res.send("Server is Live"));

// Protect routes below: only authenticated users can access
app.use(requireAuth());

// API routes
app.use("/api/ai", aiRouter); // AI-related features (image generation, etc.)
app.use("/api/user", userRouter); // user-related operations (creations, likes, etc.)

// Start server
app.listen(PORT, () => {
  console.log("Server is Running on PORT", PORT);
});
