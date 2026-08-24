import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import adminRoutes from "./routes/adminRoutes";
import { connectDB } from "./config/db";
import { corsMiddleware } from "./config/cors";
import { setupSwagger } from "./config/swagger";
import { globalLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorMiddleware";
import path from "path";
import fs from "fs";

const app = express();

connectDB();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", "http:", "https:"],
      },
    },
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Strip /api prefix if present (e.g. from Vercel rewrites or direct /api calls)
app.use((req: Request, _res: Response, next: NextFunction): void => {
  if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  } else if (req.url === "/api") {
    req.url = "/";
  }
  next();
});

setupSwagger(app);

app.use("/auth", authRoutes);
app.use("/", authRoutes);

app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

app.get("/api-status", (_req: Request, res: Response): void => {
  res.json({ status: "ok", message: "Task API is running!" });
});

const frontendDistPath = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

app.use((req: Request, res: Response): void => {
  if (
    req.path.startsWith("/auth") ||
    req.path.startsWith("/tasks") ||
    req.path.startsWith("/admin") ||
    req.path === "/api-status" ||
    req.xhr ||
    req.headers.accept?.includes("application/json")
  ) {
    res.status(404).json({ message: `API endpoint ${req.method} ${req.path} not found` });
    return;
  }
  const indexPath = path.join(frontendDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: `API endpoint ${req.method} ${req.path} not found` });
  }
});

app.use(errorHandler);

export default app;
