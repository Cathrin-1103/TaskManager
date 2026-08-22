import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload, AuthenticatedRequest } from "../types";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
}

