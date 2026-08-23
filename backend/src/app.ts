import express, { Request, Response } from "express";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { connectDB } from "./config/db";
import { corsMiddleware } from "./config/cors";
import { setupSwagger } from "./config/swagger";
import path from "path";

const app = express();

connectDB();

app.use(corsMiddleware);
app.use(express.json());

setupSwagger(app);

app.use("/auth", authRoutes);
app.use("/", authRoutes);

app.use("/tasks", taskRoutes);

const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("/api-status", (_req: Request, res: Response): void => {
  res.send("Task API is running!");
});

app.get("*", (req: Request, res: Response): void => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/tasks")) {
    res.status(404).json({ message: "API endpoint not found" });
    return;
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.send("Task API is running!");
    }
  });
});

export default app;
