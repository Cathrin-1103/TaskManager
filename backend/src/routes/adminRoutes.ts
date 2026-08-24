import { Router, RequestHandler } from "express";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware";
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/adminController";

const router = Router();

router.use(requireAuth as RequestHandler);
router.use(requireAdmin as RequestHandler);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
