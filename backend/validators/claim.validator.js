import { body, query, param } from "express-validator";

export const submitClaimValidator = [
  body("purchasedPolicyId")
    .notEmpty().withMessage("Purchased policy ID is required.")
    .isMongoId().withMessage("Invalid purchased policy ID."),

  body("title")
    .trim()
    .notEmpty().withMessage("Claim title is required.")
    .isLength({ min: 5, max: 150 }).withMessage("Title must be between 5 and 150 characters."),

  body("description")
    .trim()
    .notEmpty().withMessage("Claim description is required.")
    .isLength({ min: 20, max: 5000 }).withMessage("Description must be between 20 and 5000 characters."),

  body("incidentDate")
    .notEmpty().withMessage("Incident date is required.")
    .isISO8601().withMessage("Incident date must be a valid date.")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Incident date cannot be in the future.");
      }
      return true;
    }),

  body("claimAmount")
    .notEmpty().withMessage("Claim amount is required.")
    .isFloat({ min: 1 }).withMessage("Claim amount must be at least $1."),

  body("incidentLocation.address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address cannot exceed 200 characters."),

  body("incidentLocation.city")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("City cannot exceed 100 characters."),

  body("incidentLocation.state")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("State cannot exceed 100 characters."),

  body("incidentLocation.country")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Country cannot exceed 100 characters."),
];

export const reviewClaimValidator = [
  param("claimId")
    .isMongoId().withMessage("Invalid claim ID."),

  body("status")
    .notEmpty().withMessage("Status is required.")
    .isIn(["under_review", "approved", "rejected"])
    .withMessage("Status must be one of: under_review, approved, rejected."),

  body("adjusterNote")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Adjuster note cannot exceed 2000 characters."),

  body("approvedAmount")
    .if(body("status").equals("approved"))
    .notEmpty().withMessage("Approved amount is required when approving a claim.")
    .isFloat({ min: 0 }).withMessage("Approved amount must be non-negative."),

  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .trim()
    .notEmpty().withMessage("Rejection reason is required when rejecting a claim.")
    .isLength({ min: 10, max: 1000 }).withMessage("Rejection reason must be between 10 and 1000 characters."),

  body("deductibleApplied")
    .optional()
    .isFloat({ min: 0 }).withMessage("Deductible applied must be non-negative."),
];

export const claimQueryValidator = [
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("status")
    .optional({ checkFalsy: true })
    .isIn(["submitted", "under_review", "approved", "rejected", "withdrawn"])
    .withMessage("Invalid status filter."),

  query("flagged")
    .optional({ checkFalsy: true })
    .isIn(["true", "false"]).withMessage("Flagged must be true or false."),

  query("sortBy")
    .optional({ checkFalsy: true })
    .isIn(["createdAt", "claimAmount", "incidentDate", "status"])
    .withMessage("Invalid sort field."),

  query("order")
    .optional({ checkFalsy: true })
    .isIn(["asc", "desc"]).withMessage("Order must be asc or desc."),
];

export const assignAdjusterValidator = [
  param("claimId")
    .isMongoId().withMessage("Invalid claim ID."),

  body("adjusterId")
    .notEmpty().withMessage("Adjuster ID is required.")
    .isMongoId().withMessage("Invalid adjuster ID."),
];
