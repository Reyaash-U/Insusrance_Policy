import jwt from "jsonwebtoken";

/**
 * Generates a short-lived JWT for email verification.
 * @param {string} userId
 * @returns {string} Signed token (expires in 24 hours)
 */
export const generateEmailVerificationToken = (userId) => {
  return jwt.sign(
    { userId, purpose: "email-verification" },
    process.env.EMAIL_VERIFY_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_EXPIRES_IN || "24h" }
  );
};

/**
 * Verifies an email verification token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
export const verifyEmailVerificationToken = (token) => {
  const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);

  if (decoded.purpose !== "email-verification") {
    throw new Error("Invalid token purpose.");
  }

  return decoded;
};

/**
 * Generates a short-lived JWT for password reset.
 * @param {string} userId
 * @returns {string} Signed token (expires in 1 hour)
 */
export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, purpose: "password-reset" },
    process.env.EMAIL_VERIFY_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Verifies a password reset token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyPasswordResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);

  if (decoded.purpose !== "password-reset") {
    throw new Error("Invalid token purpose.");
  }

  return decoded;
};
