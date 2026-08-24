import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "../models/User";
import { config } from "../config";
import { AuthenticatedRequest } from "../types";

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  let { username, email, password, role } = req.body;

  if (!username || typeof username !== "string" || !email || typeof email !== "string" || !password || typeof password !== "string") {
    res.status(400).json({ message: "Username, email, and password are required" });
    return;
  }

  username = username.trim();
  email = email.trim().toLowerCase();

  if (username.length < 3) {
    res.status(400).json({ message: "Username must be at least 3 characters" });
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Valid email address is required (e.g. user@example.com)" });
    return;
  }

  if (!PASSWORD_REGEX.test(password)) {
    res.status(400).json({ message: "Password must be at least 6 characters, contain letters & numbers, and include at least 1 special character" });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }

  const userRole = role === "admin" ? "admin" : "user";
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, passwordHash, role: userRole });
  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  let { email, username, password } = req.body;
  const userEmail = email || username;

  if (!userEmail || typeof userEmail !== "string" || !password || typeof password !== "string") {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  const trimmedEmail = userEmail.trim().toLowerCase();
  let user = await User.findOne({ email: trimmedEmail });

  // Auto-provision default demo accounts on demand if missing from database
  if (!user && (trimmedEmail === "alex@taskmanager.com" || trimmedEmail === "sarah@taskmanager.com")) {
    const isAlex = trimmedEmail === "alex@taskmanager.com";
    const passwordHash = await bcrypt.hash("Password123!", 10);
    user = new User({
      _id: isAlex ? 1 : 2,
      username: isAlex ? "alex" : "sarah",
      email: trimmedEmail,
      passwordHash,
      role: isAlex ? "admin" : "user",
    });
    await user.save().catch(() => {});
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const payload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || "user",
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.accessTokenExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiry as any,
  });

  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        $each: [refreshToken],
        $slice: -5,
      },
    },
  });

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    token,
    refreshToken,
    username: user.username,
    email: user.email,
    role: user.role || "user",
    userId: user._id.toString(),
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
  });
};

export const refreshTokenUser = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ message: "Refresh token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as {
      id: string;
      email: string;
      username: string;
      role?: "user" | "admin";
    };

    const user = await User.findOne({ email: decoded.email, refreshTokens: refreshToken });
    if (!user) {
      res.status(401).json({ message: "Invalid or revoked refresh token" });
      return;
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || "user",
    };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry as any,
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
  
  if (refreshToken) {
    try {
      await User.updateOne(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    } catch (_e) {}
  }

  res.clearCookie("token");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  let { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  email = email.trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    res.status(200).json({ message: "If that email is registered, a password reset link has been sent." });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  await user.save();

  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

  if (process.env.NODE_ENV !== "test" && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER || "test@example.com",
          pass: process.env.SMTP_PASS || "password",
        },
      });

      await transporter.sendMail({
        from: '"Task Workspace" <no-reply@taskworkspace.com>',
        to: user.email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Click this link or enter token to reset your password: ${resetUrl}\nToken: ${resetToken}`,
        html: `<p>You requested a password reset for Task Workspace.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>Reset Token: <code>${resetToken}</code></p>`,
      });
    } catch (_e) {}
  }

  res.status(200).json({
    message: "If that email is registered, a password reset link has been sent.",
    resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
    res.status(400).json({ message: "Reset token and new password are required" });
    return;
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    res.status(400).json({ message: "Password must be at least 6 characters, contain letters & numbers, and include at least 1 special character" });
    return;
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ message: "Invalid or expired password reset token" });
    return;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
};
