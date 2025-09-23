import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";

// transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g. 'gmail'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// generate random 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// save otp in user
const saveOTP = async (userId, otp) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min validity

  await User.findByIdAndUpdate(userId, {
    otp: { code: otp, expiresAt },
  });
};

// send email
const sendOTPByEmail = async (email, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code - InstaMitr",
    html: `<h2>Your OTP is: <b>${otp}</b></h2>
           <p>It will expire in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// verify otp
const verifyOTP = async (userId, otpToVerify) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: "User not found" };

  if (!user.otp?.code) {
    return { success: false, message: "No OTP found" };
  }

  if (new Date() > new Date(user.otp.expiresAt)) {
    return { success: false, message: "OTP expired" };
  }

  if (user.otp.code !== otpToVerify) {
    return { success: false, message: "Invalid OTP" };
  }

  user.otpVerified = true;
  user.otp = undefined; // clear otp
  await user.save();

  return { success: true, message: "OTP verified successfully" };
};

// main helper
const generateAndSendOTP = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: "User not found" };

  const otp = generateOTP();
  await saveOTP(userId, otp);
  await sendOTPByEmail(user.email, otp);

  return { success: true, message: "OTP sent successfully" };
};

export { generateAndSendOTP, verifyOTP };
