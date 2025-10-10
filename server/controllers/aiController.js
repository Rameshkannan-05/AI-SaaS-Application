import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import FormData from "form-data";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// import pkg from "pdf-parse";
// const pdf = pkg;
const { default: pdf } = await import("pdf-parse");



// Gemini AI
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // if the user have free plan and limit reached
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue",
      });
    }

    // Gemini AI
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    // the output we're getting from Gemini
    const content = response.choices[0].message.content;

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    // updating free_usage if the user have free plan
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    // final response to the client
    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // if the user have free plan and limit reached
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue",
      });
    }

    // Gemini AI
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    // the output we're getting from Gemini
    const content = response.choices[0].message.content;

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    // updating free_usage if the user have free plan
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    // final response to the client
    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    // image generation is only for premium users
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // Clipdrop API
    // the below code is copied from the clipdrop API DOCS
    const formData = new FormData();
    formData.append("prompt", prompt);
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(), // this adds proper Content-Type with boundary
          "x-api-key": process.env.CLIPDROP_API_KEY, // our API key
        },
        responseType: "arraybuffer",
      }
    );

    //  It converts raw image data into a base64-encoded string
    // that can be used directly in HTML or JSX to display an image.

    const base64Image = `data:image/png;base64,${
      // data:image/png;base64,
      // This is the prefix that tells the browser:
      // “Hey! This is a PNG image, and it's encoded in base64.”

      Buffer.from(data, "binary")
        // Buffer.from(data, 'binary')
        // This creates a Buffer (a way to handle raw binary data in Node.js) from the data variable.
        // The 'binary' tells it: “Treat this input as binary data.”

        .toString("base64")
      // .toString('base64')
      // This converts the binary Buffer into a base64 string — a long string of letters and numbers.
    }`;

    // Storing the generated image to cloud(cloudinary)
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image',${publish ?? false})`;
    // ${publish ?? false} If publish is null or undefined, use false instead

    // final response to the client
    res.json({ success: true, secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { image } = req.file;
    const plan = req.plan;

    // image generation is only for premium users
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // Upload the image to Cloudinary and apply a transformation to remove its background
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      // Specify which transformation we want to apply to the image
      transformation: [
        {
          // Tell Cloudinary to apply the background removal effect
          effect: "background_removal",

          // Use Cloudinary's built-in background removal mode
          background_removal: "remove_the_background",
        },
      ],
    });
    // After upload, Cloudinary returns a secure URL of the transformed image
    // We extract that URL from the response and store it in 'secure_url'

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId},'Remove background from image', ${secure_url}, 'image')`;

    // final response to the client
    res.json({ success: true, secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const { image } = req.file;
    const plan = req.plan;

    // image generation is only for premium users
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // Step 1: Send the image file to Cloudinary and get its unique identifier (public_id)
    // This ID is like a name tag Cloudinary gives to your image so you can refer to it later
    const { public_id } = await cloudinary.uploader.upload(image.path);

    // Step 2: Use that public_id to create a URL for the image with special effects
    // Here, you're telling Cloudinary: "Give me a link to the image, but apply some magic to it first"
    const imageUrl = cloudinary.url(public_id, {
      // Apply a transformation using Cloudinary's generative removal effect
      // This effect removes a specific object from the image (e.g., "person", "car", "tree")
      transformation: [
        {
          effect: `gen_remove:${object}`, // Replace 'object' with the thing you want removed
        },
      ],

      // Specify that the resource being transformed is an image
      resource_type: "image",
    });
    // 'imageUrl' now holds the link to the image with the specified object removed

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId},${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    // final response to the client
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    // image generation is only for premium users
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // checking if the resume is > 5 MB
    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    // Gemini AI
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // the output we're getting from Gemini
    const content = response.choices[0].message.content;

    // Storing the requested and generated results in neon postgres database
    await sql` INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId},'Review the uploaded resume', ${content}, 'resume-review')`;

    // final response to the client
    res.json({ success: true, content });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
