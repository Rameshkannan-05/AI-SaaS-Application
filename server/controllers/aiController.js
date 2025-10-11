// ===============================
// AI SaaS Controllers
// Handles all AI-related operations such as:
// - Article generation
// - Blog title generation
// - Image generation & editing
// - Resume review
// Uses Gemini AI, Clipdrop API, Cloudinary, Neon Postgres DB, and Clerk authentication
// ===============================

import OpenAI from "openai";
import sql from "../configs/db.js"; // Neon PostgreSQL client
import { clerkClient } from "@clerk/express"; // User management
import FormData from "form-data";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary"; // Cloud storage for images
import fs from "fs";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse"); // For reading resume PDFs

// Initialize Gemini AI client
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// ===============================
// Generate Article
// ===============================
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Limit check for free users
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue",
      });
    }

    // Gemini AI article generation
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });
    const content = response.choices[0].message.content;

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type)
               VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    // Update free usage
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ===============================
// Generate Blog Title
// ===============================
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue",
      });
    }

    // Gemini AI blog title generation
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });
    const content = response.choices[0].message.content;

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type)
               VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ===============================
// Generate Image
// ===============================
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "Premium feature only" });
    }

    // Clipdrop API for image generation
    const formData = new FormData();
    formData.append("prompt", prompt);
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.CLIPDROP_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    // Convert raw image to base64 string
    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    // Upload image to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
               VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${
      publish ?? false
    })`;

    res.json({ success: true, secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ===============================
// Remove Background from Image
// ===============================
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "Premium feature only" });
    }

    // Upload image to Cloudinary with background removal
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type)
               VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

    res.json({ success: true, secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ===============================
// Remove Object from Image
// ===============================
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "Premium feature only" });
    }

    // Step 1: Upload image to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path);

    // Step 2: Generate URL with object removed
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type)
               VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ===============================
// Resume Review
// ===============================
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "Premium feature only" });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: "Resume exceeds 5MB" });
    }

    // Read PDF file
    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    const prompt = `Review the following resume and provide feedback:\n\n${pdfData.text}`;

    // Gemini AI resume review
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });
    const content = response.choices[0].message.content;

    // Store result in database
    await sql`INSERT INTO creations (user_id, prompt, content, type)
               VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
