import { validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse.js";

/**
 * Reads results from express-validator chains and short-circuits
 * the request if any validation errors are present.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return sendError(res, 422, "Validation failed.", formatted);
  }
  next();
};

export default validate;
