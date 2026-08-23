import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { config } from "../config";

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  let { username, email, password } = req.body;

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

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, passwordHash });
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

  const user = await User.findOne({ email: trimmedEmail });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const payload = { id: user._id.toString(), email: user.email, username: user.username };

  const token = jwt.sign(
    payload,
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiry as any }
  );

  const refreshToken = jwt.sign(
    payload,
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiry as any }
  );

  // Atomic push and slice to prevent VersionError race conditions
  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        $each: [refreshToken],
        $slice: -5,
      },
    },
  });

  res.json({ token, refreshToken, username: user.username, email: user.email, userId: user._id.toString() });
};

export const refreshTokenUser = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ message: "Refresh token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as {
      id: string;
      email: string;
      username: string;
    };

    const user = await User.findOne({ email: decoded.email, refreshTokens: refreshToken });
    if (!user) {
      res.status(401).json({ message: "Invalid or revoked refresh token" });
      return;
    }

    const payload = { id: user._id.toString(), email: user.email, username: user.username };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry as any,
    });

    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token is required" });
    return;
  }

  try {
    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during logout" });
  }
};
