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
import {
  validateTaskCreate,
  validateTaskUpdate,
  validateComment,
} from "../middleware/validationMiddleware";

const router = Router();

router.use(requireAuth as RequestHandler);

router.get("/", getTasks);
router.post("/", validateTaskCreate, createTask);
router.put("/:id", validateTaskUpdate, updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/like", likeTask);
router.delete("/:id/like", unlikeTask);
router.post("/:id/comments", validateComment, addComment);

export default router;
