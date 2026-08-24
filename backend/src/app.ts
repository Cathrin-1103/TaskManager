import express, { Request, Response } from "express";
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

setupSwagger(app);

app.use("/auth", authRoutes);
app.use("/", authRoutes);

app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("/api-status", (_req: Request, res: Response): void => {
  res.send("Task API is running!");
});

app.get("*", (req: Request, res: Response): void => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/tasks") || req.path.startsWith("/admin")) {
    res.status(404).json({ message: "API endpoint not found" });
    return;
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.send("Task API is running!");
    }
  });
});

app.use(errorHandler);

export default app;
