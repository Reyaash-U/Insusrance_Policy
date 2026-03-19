/**
 * Wraps an async route handler and forwards errors to Express error middleware.
 * Eliminates the need for try/catch in every controller.
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
