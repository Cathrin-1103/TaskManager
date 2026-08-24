import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  skip: () => process.env.NODE_ENV === "test",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register attempts, please try again after 15 minutes" },
  skip: () => process.env.NODE_ENV === "test",
});
