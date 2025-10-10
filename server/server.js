import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
await connectCloudinary();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // adds Auth object on each request. from Auth(req.auth()) we can get user data

app.get("/", (req, res) => res.send("Server is Live"));

app.use(requireAuth()); // the following routes are protected i.e only logged in users can access it.
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log("Server is Running on PORT", PORT);
});
