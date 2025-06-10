import express from "express";
import {
  sendMessage,
  getMessage,
  reactToMessage,
} from "../controllers/message.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Send message to a user
router.route("/send/:id").post(isAuthenticated, sendMessage);

// Get all messages between two users
router.route("/all/:id").get(isAuthenticated, getMessage);

// React to a specific message
router.route("/react/:messageId").post(isAuthenticated, reactToMessage);

export default router;
