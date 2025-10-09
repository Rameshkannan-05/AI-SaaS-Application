import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import FormData from "form-data";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";

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
     console.log("API KEY:", process.env.CLIPDROP_API_KEY);

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
    res.json({ success: false, message: error.message});
  }
};
