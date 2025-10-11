import express from "express";
import { auth } from "../middlewares/auth.js"; // Middleware to check user's plan & free usage
import {
  generateArticle,
  generateBlogTitle,
  generateImage,
  removeImageBackground,
  removeImageObject,
  resumeReview,
} from "../controllers/aiController.js"; // AI SaaS controllers
import { upload } from "../configs/multer.js"; // For handling file uploads (images/resumes)

const aiRouter = express.Router();

// ===============================
// AI Routes
// ===============================

// Generate an AI-written article
aiRouter.post("/generate-article", auth, generateArticle);

// Generate a blog title using AI
aiRouter.post("/generate-blog-title", auth, generateBlogTitle);

// Generate an AI image (premium users only)
aiRouter.post("/generate-image", auth, generateImage);

// Remove background from uploaded image (premium users only)
aiRouter.post(
  "/remove-image-background",
  upload.single("image"), // Handle single image upload
  auth,
  removeImageBackground
);

// Remove a specific object from uploaded image (premium users only)
aiRouter.post(
  "/remove-image-object",
  upload.single("image"), // Handle single image upload
  auth,
  removeImageObject
);

// Review an uploaded resume using AI (premium users only)
aiRouter.post("/resume-review", upload.single("resume"), auth, resumeReview);

export default aiRouter;
