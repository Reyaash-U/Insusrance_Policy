import { body } from "express-validator";

export const registerValidator = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("First name must be between 2 and 50 characters.")
    .matches(/^[a-zA-Z\s'-]+$/).withMessage("First name can only contain letters, spaces, hyphens, and apostrophes."),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Last name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("Last name must be between 2 and 50 characters.")
    .matches(/^[a-zA-Z\s'-]+$/).withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
    .matches(/\d/).withMessage("Password must contain at least one number.")
    .matches(/[@$!%*?&_\-#^]/).withMessage("Password must contain at least one special character (@$!%*?&_-#^)."),

  body("role")
    .optional()
    .isIn(["customer", "agent", "adjuster"])
    .withMessage("Role must be one of: customer, agent, adjuster. Admin accounts are created separately."),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage("Please provide a valid phone number."),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required."),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token")
    .notEmpty().withMessage("Reset token is required."),

  body("password")
    .notEmpty().withMessage("New password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
    .matches(/\d/).withMessage("Password must contain at least one number.")
    .matches(/[@$!%*?&_\-#^]/).withMessage("Password must contain at least one special character (@$!%*?&_-#^)."),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your new password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required."),

  body("newPassword")
    .notEmpty().withMessage("New password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
    .matches(/\d/).withMessage("Password must contain at least one number.")
    .matches(/[@$!%*?&_\-#^]/).withMessage("Password must contain at least one special character.")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from your current password.");
      }
      return true;
    }),
];
