import { Router, RequestHandler } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  likeTask,
  unlikeTask,
  addComment,
} from "../controllers/taskController";

const router = Router();

router.use(requireAuth as RequestHandler);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/like", likeTask);
router.delete("/:id/like", unlikeTask);
router.post("/:id/comments", addComment);

export default router;
