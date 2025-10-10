import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
} from "../controllers/userController.js";

const userRouter = express.Router();

// we don't have to send anything from the body, so GET method
userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", auth, getPublishedCreations);

// we have to send the creationId from the body, so POST method
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);

export default userRouter;
