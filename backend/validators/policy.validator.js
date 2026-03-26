import { body, query, param } from "express-validator";

export const createPolicyValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Policy name is required.")
    .isLength({ min: 3, max: 120 }).withMessage("Name must be between 3 and 120 characters."),

  body("category")
    .notEmpty().withMessage("Category is required.")
    .isIn(["health", "auto", "home", "life", "travel", "business", "other"])
    .withMessage("Invalid category."),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required.")
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be between 10 and 2000 characters."),

  body("basePremium")
    .notEmpty().withMessage("Base premium is required.")
    .isFloat({ min: 0 }).withMessage("Base premium must be a non-negative number."),

  body("durationMonths")
    .notEmpty().withMessage("Duration is required.")
    .isInt({ min: 1, max: 360 }).withMessage("Duration must be between 1 and 360 months."),

  body("maxClaimAmount")
    .notEmpty().withMessage("Max claim amount is required.")
    .isFloat({ min: 1 }).withMessage("Max claim amount must be greater than 0."),

  body("deductible")
    .optional()
    .isFloat({ min: 0 }).withMessage("Deductible must be non-negative."),

  body("waitingPeriodDays")
    .optional()
    .isInt({ min: 0 }).withMessage("Waiting period must be a non-negative integer."),

  body("minAge")
    .optional()
    .isInt({ min: 0, max: 120 }).withMessage("Minimum age must be between 0 and 120."),

  body("maxAge")
    .optional()
    .isInt({ min: 0, max: 120 }).withMessage("Maximum age must be between 0 and 120.")
    .custom((value, { req }) => {
      if (req.body.minAge !== undefined && value < req.body.minAge) {
        throw new Error("Max age must be greater than or equal to min age.");
      }
      return true;
    }),

  body("coverages")
    .optional()
    .isArray().withMessage("Coverages must be an array."),

  body("coverages.*.name")
    .optional()
    .trim()
    .notEmpty().withMessage("Each coverage must have a name."),

  body("coverages.*.limit")
    .optional()
    .isFloat({ min: 0 }).withMessage("Each coverage limit must be non-negative."),

  body("availableAddOns")
    .optional()
    .isArray().withMessage("Add-ons must be an array."),

  body("availableAddOns.*.name")
    .if(body("availableAddOns").exists())
    .trim()
    .notEmpty().withMessage("Each add-on must have a name."),

  body("availableAddOns.*.extraPremiumRate")
    .if(body("availableAddOns").exists())
    .isFloat({ min: 0, max: 1 }).withMessage("Extra premium rate must be between 0 and 1."),

  body("ageFactor")
    .optional()
    .isFloat({ min: 0.1 }).withMessage("Age factor must be at least 0.1."),

  body("riskFactor")
    .optional()
    .isFloat({ min: 0.1 }).withMessage("Risk factor must be at least 0.1."),

  body("assetValueRate")
    .optional()
    .isFloat({ min: 0 }).withMessage("Asset value rate must be non-negative."),

  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array.")
    .custom((arr) => arr.every((t) => typeof t === "string"))
    .withMessage("Each tag must be a string."),

  body("isFeatured")
    .optional()
    .isBoolean().withMessage("isFeatured must be true or false."),
];

export const updatePolicyValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 }).withMessage("Name must be between 3 and 120 characters."),

  body("category")
    .optional()
    .isIn(["health", "auto", "home", "life", "travel", "business", "other"])
    .withMessage("Invalid category."),

  body("basePremium")
    .optional()
    .isFloat({ min: 0 }).withMessage("Base premium must be non-negative."),

  body("durationMonths")
    .optional()
    .isInt({ min: 1, max: 360 }).withMessage("Duration must be between 1 and 360 months."),

  body("maxClaimAmount")
    .optional()
    .isFloat({ min: 1 }).withMessage("Max claim amount must be greater than 0."),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive must be true or false."),

  body("isFeatured")
    .optional()
    .isBoolean().withMessage("isFeatured must be true or false."),
];

export const policyQueryValidator = [
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("category")
    .optional({ checkFalsy: true })
    .isIn(["health", "auto", "home", "life", "travel", "business", "other"])
    .withMessage("Invalid category filter."),

  query("search")
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage("Search query too long."),

  query("sortBy")
    .optional({ checkFalsy: true })
    .isIn(["createdAt", "basePremium", "name", "durationMonths"])
    .withMessage("Invalid sort field."),

  query("order")
    .optional({ checkFalsy: true })
    .isIn(["asc", "desc"]).withMessage("Order must be asc or desc."),
];

export const calculatePremiumValidator = [
  body("policyId")
    .notEmpty().withMessage("Policy ID is required.")
    .isMongoId().withMessage("Invalid policy ID."),

  body("customerAge")
    .notEmpty().withMessage("Customer age is required.")
    .toInt()
    .isInt({ min: 0, max: 120 }).withMessage("Age must be between 0 and 120."),

  body("riskLevel")
    .notEmpty().withMessage("Risk level is required.")
    .isIn(["low", "medium", "high"]).withMessage("Risk level must be low, medium, or high."),

  body("assetValue")
    .notEmpty().withMessage("Asset value is required.")
    .toFloat()
    .isFloat({ min: 0 }).withMessage("Asset value must be non-negative."),

  body("selectedAddOns")
    .optional()
    .isArray().withMessage("Selected add-ons must be an array."),
];

export const purchasePolicyValidator = [
  body("policyId")
    .notEmpty().withMessage("Policy ID is required.")
    .isMongoId().withMessage("Invalid policy ID."),

  body("customerAge")
    .notEmpty().withMessage("Customer age is required.")
    .toInt()
    .isInt({ min: 0, max: 120 }).withMessage("Age must be between 0 and 120."),

  body("riskLevel")
    .notEmpty().withMessage("Risk level is required.")
    .isIn(["low", "medium", "high"]).withMessage("Risk level must be low, medium, or high."),

  body("assetValue")
    .notEmpty().withMessage("Asset value is required.")
    .toFloat()
    .isFloat({ min: 0 }).withMessage("Asset value must be non-negative."),

  body("selectedAddOns")
    .optional()
    .isArray().withMessage("Selected add-ons must be an array."),

  body("startDate")
    .notEmpty().withMessage("Start date is required.")
    .isISO8601({ strict: false }).withMessage("Start date must be a valid date.")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("Start date cannot be in the past.");
      return true;
    }),
];
