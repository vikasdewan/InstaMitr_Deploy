import express from "express";
import {
  editProfile,
  followOrUnFollow,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  getMe,
  resendOTP,
  verifyUserOTP
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import passport from "passport";
 

const router = express.Router();

router.route("/register").post(register);
router.route("/verify-otp").post(verifyUserOTP);
router.route("/resend-otp").post(resendOTP);
router.route("/login").post(login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleAuthCallback
);

 
router.get("/me", getMe);

router.route("/logout").get(logout);
router.route("/:id/profile").get(isAuthenticated, getProfile);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").put(resetPassword);
router
  .route("/profile/edit")
  .post(isAuthenticated, upload.single("profileImage"), editProfile);
router.route("/suggested").get(isAuthenticated, getSuggestedUsers);
router.route("/followorunfollow/:id").post(isAuthenticated, followOrUnFollow);
router.route("/change-password").put(isAuthenticated,changePassword);

export default router;
