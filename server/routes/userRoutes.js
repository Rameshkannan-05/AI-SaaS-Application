import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
} from "../controllers/userController.js";

const userRouter = express.Router();

/**
 * Routes for user-related operations
 * All routes require authentication (auth middleware)
 */

// Fetch all creations of the logged-in user
// GET request, no body required
userRouter.get("/get-user-creations", auth, getUserCreations);

// Fetch all published creations
// GET request, no body required
userRouter.get("/get-published-creations", auth, getPublishedCreations);

// Toggle like/unlike on a creation
// POST request, requires { creationId } in body
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);

export default userRouter;
