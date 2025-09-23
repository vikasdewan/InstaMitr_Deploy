// models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ---------- Authentication & Roles ----------
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
     

 
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },

 
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
   

     
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    //for otp
    otpVerified: { type: Boolean, default: false },
  otp: {
    code: { type: String },
    expiresAt: { type: Date },
  },

    },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
