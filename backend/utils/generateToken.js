import jwt from "jsonwebtoken";

/**
 * Signs and returns a JWT access token for a given user.
 * @param {object} payload - Data to encode (userId, role)
 * @returns {string} Signed JWT
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "insurance-api",
    audience: "insurance-client",
  });
};

/**
 * Verifies a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "insurance-api",
    audience: "insurance-client",
  });
};

/**
 * Attaches the JWT as an HTTP-only cookie on the response.
 * @param {object} res - Express response
 * @param {string} token - Signed JWT
 */
export const attachTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/**
 * Clears the access token cookie (used on logout).
 * @param {object} res - Express response
 */
export const clearTokenCookie = (res) => {
  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });
};
