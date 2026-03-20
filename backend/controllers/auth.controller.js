import User from "../models/User.model.js";
import {
  generateAccessToken,
  attachTokenCookie,
  clearTokenCookie,
} from "../utils/generateToken.js";
import {
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/generateEmailToken.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── Register ───────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Public
 */
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  // Block admin self-registration
  if (role === "admin") {
    return sendError(res, 403, "Admin accounts cannot be created through self-registration.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 409, "An account with this email already exists.");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || "customer",
    phone: phone || null,
    isEmailVerified: true,
  });

  return sendSuccess(
    res,
    201,
    "Registration successful. You can now log in.",
    { userId: user._id, email: user.email }
  );
});

// ─── Verify Email ───────────────────────────────────────────
/**
 * GET /api/auth/verify-email?token=...
 * Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return sendError(res, 400, "Verification token is missing.");
  }

  let decoded;
  try {
    decoded = verifyEmailVerificationToken(token);
  } catch {
    return sendError(res, 400, "Verification link is invalid or has expired. Please request a new one.");
  }

  const user = await User.findById(decoded.userId).select(
    "+emailVerificationToken +emailVerificationExpires"
  );

  if (!user) {
    return sendError(res, 404, "User not found.");
  }

  if (user.isEmailVerified) {
    return sendSuccess(res, 200, "Your email is already verified. You can log in.");
  }

  if (user.emailVerificationToken !== token) {
    return sendError(res, 400, "Verification token does not match. Please request a new one.");
  }

  if (user.emailVerificationExpires < new Date()) {
    return sendError(res, 400, "Verification link has expired. Please request a new one.");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch {
    // Non-blocking
  }

  return sendSuccess(res, 200, "Email verified successfully! You can now log in.");
});

// ─── Resend Verification Email ──────────────────────────────
/**
 * POST /api/auth/resend-verification
 * Public
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    "+emailVerificationToken +emailVerificationExpires"
  );

  // Generic response to prevent email enumeration
  if (!user) {
    return sendSuccess(
      res,
      200,
      "If an account with that email exists and is unverified, a new verification email has been sent."
    );
  }

  if (user.isEmailVerified) {
    return sendError(res, 400, "This email address is already verified.");
  }

  // Throttle: don't resend if a valid token was issued within the last 5 minutes
  const RESEND_COOLDOWN_MS = 5 * 60 * 1000;
  const tokenAge = user.emailVerificationExpires
    ? 24 * 60 * 60 * 1000 - (user.emailVerificationExpires - Date.now())
    : Infinity;

  if (tokenAge < RESEND_COOLDOWN_MS) {
    return sendError(
      res,
      429,
      "A verification email was sent recently. Please wait 5 minutes before requesting another."
    );
  }

  const verificationToken = generateEmailVerificationToken(user._id.toString());
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, verificationToken);

  return sendSuccess(res, 200, "Verification email has been resent. Please check your inbox.");
});

// ─── Login ──────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Fetch user with password and lock fields
  const user = await User.findOne({ email }).select(
    "+password +loginAttempts +lockUntil"
  );

  if (!user) {
    return sendError(res, 401, "Invalid email or password.");
  }

  // Check if account is locked
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return sendError(
      res,
      423,
      `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
    );
  }

  if (!user.isActive) {
    return sendError(res, 403, "Your account has been deactivated. Please contact support.");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.recordFailedLogin();

    const attemptsLeft = Math.max(0, 5 - user.loginAttempts - 1);
    return sendError(
      res,
      401,
      attemptsLeft > 0
        ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lockout.`
        : "Invalid email or password. Account has been locked for 30 minutes."
    );
  }

  // Successful login
  await user.recordSuccessfulLogin();

  const token = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  attachTokenCookie(res, token);

  return sendSuccess(res, 200, "Login successful.", {
    user: user.toSafeObject(),
    token, // also return in body for clients that prefer header-based auth
  });
});

// ─── Logout ─────────────────────────────────────────────────
/**
 * POST /api/auth/logout
 * Protected
 */
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  return sendSuccess(res, 200, "Logged out successfully.");
});

// ─── Get Current User ────────────────────────────────────────
/**
 * GET /api/auth/me
 * Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  return sendSuccess(res, 200, "User profile retrieved.", req.user.toSafeObject());
});

// ─── Forgot Password ─────────────────────────────────────────
/**
 * POST /api/auth/forgot-password
 * Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    "+passwordResetToken +passwordResetExpires"
  );

  // Always return generic response to prevent email enumeration
  const genericResponse = sendSuccess(
    res,
    200,
    "If an account with that email exists, a password reset link has been sent."
  );

  if (!user || !user.isActive) return genericResponse;

  const resetToken = generatePasswordResetToken(user._id.toString());
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({ validateBeforeSave: false });
    return sendError(res, 500, "Failed to send reset email. Please try again later.");
  }

  return genericResponse;
});

// ─── Reset Password ──────────────────────────────────────────
/**
 * POST /api/auth/reset-password
 * Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = verifyPasswordResetToken(token);
  } catch {
    return sendError(res, 400, "Reset link is invalid or has expired. Please request a new one.");
  }

  const user = await User.findById(decoded.userId).select(
    "+passwordResetToken +passwordResetExpires"
  );

  if (!user) {
    return sendError(res, 404, "User not found.");
  }

  if (user.passwordResetToken !== token || user.passwordResetExpires < new Date()) {
    return sendError(res, 400, "Reset link is invalid or has expired. Please request a new one.");
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  return sendSuccess(res, 200, "Password reset successful. You can now log in with your new password.");
});

// ─── Change Password (authenticated) ─────────────────────────
/**
 * PATCH /api/auth/change-password
 * Protected
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendError(res, 401, "Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  // Invalidate cookie so the user must log in again with the new password
  clearTokenCookie(res);

  return sendSuccess(
    res,
    200,
    "Password changed successfully. Please log in again with your new password."
  );
});
