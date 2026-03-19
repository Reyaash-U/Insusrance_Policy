import { Router } from "express";
import {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from "../validators/auth.validator.js";

const router = Router();

// ─── Public Routes ───────────────────────────────────────────
router.post("/register",             authLimiter, registerValidator,        validate, register);
router.post("/login",                authLimiter, loginValidator,           validate, login);
router.get( "/verify-email",                                                          verifyEmail);
router.post("/resend-verification",  authLimiter,                                     resendVerificationEmail);
router.post("/forgot-password",      authLimiter, forgotPasswordValidator,  validate, forgotPassword);
router.post("/reset-password",       authLimiter, resetPasswordValidator,   validate, resetPassword);

// ─── Protected Routes ────────────────────────────────────────
router.get(   "/me",              protect,                                  getMe);
router.post(  "/logout",          protect,                                  logout);
router.patch( "/change-password", protect, changePasswordValidator, validate, changePassword);

export default router;
