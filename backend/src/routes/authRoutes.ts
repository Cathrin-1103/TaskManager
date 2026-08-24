import { Router, RequestHandler } from "express";
import {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { validateRegister, validateLogin } from "../middleware/validationMiddleware";
import { authLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
router.post("/refresh", refreshTokenUser);
router.post("/logout", logoutUser);
router.get("/me", requireAuth as RequestHandler, getCurrentUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
