import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { populate } from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {verifyOTP, generateAndSendOTP } from "../utils/otp.utils.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    let existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      if (!existingUser.otpVerified) {
        // Resend OTP for unverified user
        const otpResult = await generateAndSendOTP(existingUser._id);

        if (!otpResult.success) {
          return res
            .status(500)
            .json({ message: otpResult.message, success: false });
        }

        return res.status(200).json({
          message:
            "User already exists but is not verified. A new OTP has been sent.",
          success: true,
          userId: existingUser._id,
        });
      }

      // If already verified
      return res.status(400).json({
        message: "User already exists with this email or username",
        success: false,
      });
    }

    // Create fresh user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      otpVerified: false,
    });

    // Send OTP
    const otpResult = await generateAndSendOTP(newUser._id);

    if (!otpResult.success) {
      return res
        .status(500)
        .json({ message: otpResult.message, success: false });
    }

    return res.status(201).json({
      message:
        "User registered successfully. Please verify your account with the OTP sent to your email.",
      success: true,
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};


export const verifyUserOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP required" });
    }

    const result = await verifyOTP(userId, otp);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

     await User.findByIdAndUpdate(userId, { isVerified: true });

    return res.json({ message: "OTP verified successfully", success: true });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const otpResult = await generateAndSendOTP(userId);
    if (!otpResult.success) {
      return res.status(500).json({ message: otpResult.message });
    }

    return res.json({ message: "OTP resent successfully", success: true });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;  
    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing, please check",
        status: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        status: false,
      });
    }
     
    if (!user.otpVerified) {
  return res.status(403).json({
    message: "Please verify your account first",
    success: false,
  });
}


    // console.log(user.profileImage);

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        status: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });

    // populate posts
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post?.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );

    const responseUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
    };


    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome Back ${user.username}`,
        success: true,
        user: responseUser,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user; // passport sets this

    if (!user) {
      return res.status(401).json({ message: "Google authentication failed" });
    }

    // generate token like your normal login
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });

      await User.findByIdAndUpdate(user._id,{otpVerified:true});

    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 24 * 60 * 60 * 1000,
      })
      .redirect("https://instamitr.onrender.com"); // frontend homepage
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMe = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY); // your JWT secret
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })
      .json({ message: "Logged out successfully", status: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Logout failed", status: false });
  }
};


export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || userId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId)
      .populate({ path: "posts", options: { sort: { createdAt: -1 } } })
      .populate("bookmarks")
      .populate("followers", "username profileImage _id")
      .populate("following", "username profileImage _id");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ user, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, username } = req.body;
    const profileImage = req.file;

    let cloudResponse;

    if (profileImage) {
      const fileUri = getDataUri(profileImage);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if new username is already in use by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists. Please choose a different one.",
          success: false,
        });
      }
    }

    if (bio) user.bio = bio;
    if (username) user.username = username;
    if (profileImage) user.profileImage = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      success: false,
    });
  }
};


export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"); //remove password from the response
    
    if (!suggestedUsers) { //if there is no suggested user
      return res.status(400).json({
        message: "Currently No users found",
      });
    }

    return res.status(202).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const followOrUnFollow = async (req, res) => {
  try {
    const followKrneWala = req.id; // vikas
    const jiskoFollowKrunga = req.params.id; //pratik

    if (followKrneWala === jiskoFollowKrunga) {
      return res.status(400).json({
        message: "you cannot follow Or unfollow  yourself",
        success: false,
      });
    }

    const user = await User.findById(followKrneWala);
    const userToFollow = await User.findById(jiskoFollowKrunga);

    if (!user || !userToFollow) {
      return res.status(400).json({
        message: "USER NOT FOUND",
        success: false,
      });
    }

    //now we check  if user is already following or not

    const isFollowing = user.following.includes(jiskoFollowKrunga); // pratik ko agar follow karunga toh wo mere following array me aayega

    if (isFollowing) {
      //if user is already following then we remove him from following array
      //unfollow logic

      await Promise.all([
        // jab bhi hum two document ya table type ko handle karte hai toh promise.all ka use karte hai..

        User.updateOne(
          { _id: followKrneWala },
          { $pull: { following: jiskoFollowKrunga } }
        ), // vikas ne pratik ko follow kar diya

        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $pull: { followers: followKrneWala } }
        ),
      ]);

      return res.status(200).json({
        message: "Unfollow Successfully",
        success: true,
      });
    } else {
      //follow logic ayega

      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $push: { following: jiskoFollowKrunga } }
        ), // vikas ne pratik ko follow kar diya

        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $push: { followers: followKrneWala } }
        ),
      ]);

      return res.status(200).json({
        message: "follow Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

 
export const changePassword = async (req, res) => {
  try {
    const userId = req.id; // coming from isAuthenticated middleware
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Both old and new password are required",
        success: false,
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect",
        success: false,
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or any SMTP service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Your Password",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    res.status(200).json({ success: true, message: "Reset password email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ success: false, message: "New password is required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired token" });

    // Check if new password is same as old password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      return res
        .status(400)
        .json({ status: false, message: "New password cannot be the same as old password" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};