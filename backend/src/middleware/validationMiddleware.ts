import { Request, Response, NextFunction } from "express";

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
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

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, username, password } = req.body;
  const userEmail = email || username;

  if (!userEmail || typeof userEmail !== "string" || !password || typeof password !== "string") {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  next();
};

export const validateTaskCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, dueDate, priority } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "Title required" });
    return;
  }

  if (dueDate) {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
      res.status(400).json({ message: "Invalid dueDate format" });
      return;
    }
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    res.status(400).json({ message: "Priority must be 'low', 'medium', or 'high'" });
    return;
  }

  next();
};

export const validateTaskUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, dueDate, priority } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ message: "Invalid title" });
      return;
    }
  }

  if (dueDate !== undefined && dueDate !== null) {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
      res.status(400).json({ message: "Invalid dueDate format" });
      return;
    }
  }

  if (priority !== undefined && !["low", "medium", "high"].includes(priority)) {
    res.status(400).json({ message: "Priority must be 'low', 'medium', or 'high'" });
    return;
  }

  next();
};

export const validateComment = (req: Request, res: Response, next: NextFunction): void => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ message: "Comment text required" });
    return;
  }

  next();
};
