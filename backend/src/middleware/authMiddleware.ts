import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload, AuthenticatedRequest } from "../types";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Access denied. Admin rights required." });
    return;
  }
  next();
}
