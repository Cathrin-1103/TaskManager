import { Request } from "express";

export interface User {
  username: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
  refreshTokens?: string[];
}

export type UsersMap = Record<string, User>;

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  username?: string;
  text: string;
  createdAt?: string | Date;
}

export interface Task {
  id: string;
  userId?: string;
  authorEmail?: string;
  authorUsername?: string;
  title: string;
  done: boolean;
  priority?: "low" | "medium" | "high";
  startDate?: string | Date;
  dueDate?: string | Date;
  createdAt?: string | Date;
  likes?: string[];
  comments?: Comment[];
}

export type TasksMap = Record<string, Task>;

export interface AuthPayload {
  id: string;
  email: string;
  username: string;
  role?: "user" | "admin";
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}
