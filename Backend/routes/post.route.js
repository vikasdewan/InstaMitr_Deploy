import express from "express";
import {
  addNewImagePost,
  addNewVideoPost,
  getAllPost,
  getUserPost,
  likePost,
  dislikePost,
  deletePost,
  addComment,
  getCommentsOfPost,
  bookmarkPost,
} from "../controllers/post.controller.js";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router
  .route("/addpost/image")
  .post(isAuthenticated, upload.array("images", 3), addNewImagePost);

router
  .route("/addpost/video")
  .post(isAuthenticated, upload.single("video"), addNewVideoPost);

router.route("/all").get(isAuthenticated, getAllPost);

router.route("/userpost/all").get(isAuthenticated, getUserPost);

router.route("/:id/like").get(isAuthenticated, likePost);

router.route("/:id/dislike").get(isAuthenticated, dislikePost);

router.route("/:id/comment").post(isAuthenticated, addComment);

router.route("/:id/comment/all").get(isAuthenticated, getCommentsOfPost);

router.route("/delete/:id").delete(isAuthenticated, deletePost);

router.route("/:id/bookmark").get(isAuthenticated, bookmarkPost);

export default router;
