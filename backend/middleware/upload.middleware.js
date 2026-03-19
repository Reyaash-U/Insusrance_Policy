import multer from "multer";
import { ALL_ALLOWED_MIMES, AVATAR_MIMES } from "../services/upload.service.js";
import { sendError } from "../utils/apiResponse.js";

// ─── Shared Config ────────────────────────────────────────────

const MAX_CLAIM_FILE_SIZE_MB = 50;  // Allow up to 50 MB for videos
const MAX_IMAGE_SIZE_MB      = 10;
const MAX_FILES_PER_CLAIM    = 10;

const memoryStorage = multer.memoryStorage();

// ─── File Filters ─────────────────────────────────────────────

const makeFileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowed = allowedMimes.join(", ");
    cb(
      Object.assign(
        new Error(`Unsupported file type '${file.mimetype}'. Allowed: ${allowed}.`),
        { code: "INVALID_FILE_TYPE" }
      ),
      false
    );
  }
};

// ─── Multer Instances ─────────────────────────────────────────

const claimUploader = multer({
  storage:    memoryStorage,
  fileFilter: makeFileFilter(ALL_ALLOWED_MIMES),
  limits: {
    fileSize: MAX_CLAIM_FILE_SIZE_MB * 1024 * 1024,
    files:    MAX_FILES_PER_CLAIM,
  },
});

const avatarUploader = multer({
  storage:    memoryStorage,
  fileFilter: makeFileFilter(AVATAR_MIMES),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
});

const thumbnailUploader = multer({
  storage:    memoryStorage,
  fileFilter: makeFileFilter(AVATAR_MIMES),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
});

// ─── Error Normaliser ─────────────────────────────────────────

const handleMulterError = (err, res) => {
  if (!err) return false;

  if (err.code === "LIMIT_FILE_SIZE") {
    sendError(res, 413, "File too large. Check the size limit for this upload type.");
    return true;
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    sendError(res, 400, `Too many files. Maximum ${MAX_FILES_PER_CLAIM} attachments per claim.`);
    return true;
  }
  if (err.code === "INVALID_FILE_TYPE" || err instanceof multer.MulterError === false) {
    sendError(res, 415, err.message);
    return true;
  }
  if (err instanceof multer.MulterError) {
    sendError(res, 400, `Upload error: ${err.message}`);
    return true;
  }
  return false;
};

// ─── Exported Middleware ──────────────────────────────────────

/**
 * Parses up to 10 mixed files from the "attachments" field.
 * Used on POST /api/claims.
 */
export const uploadClaimFiles = (req, res, next) => {
  claimUploader.array("attachments", MAX_FILES_PER_CLAIM)(req, res, (err) => {
    if (handleMulterError(err, res)) return;
    next();
  });
};

/**
 * Parses a single image from the "avatar" field.
 * Used on PATCH /api/users/me/avatar.
 */
export const uploadAvatar = (req, res, next) => {
  avatarUploader.single("avatar")(req, res, (err) => {
    if (handleMulterError(err, res)) return;
    next();
  });
};

/**
 * Parses a single image from the "thumbnail" field.
 * Used on POST/PUT /api/policies.
 */
export const uploadPolicyThumbnail = (req, res, next) => {
  thumbnailUploader.single("thumbnail")(req, res, (err) => {
    if (handleMulterError(err, res)) return;
    next();
  });
};

/**
 * Ensures at least one file was uploaded. Use AFTER the upload middleware.
 * Optional — only use on routes where attachments are required.
 */
export const requireFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    return sendError(res, 400, "At least one file must be uploaded.");
  }
  next();
};
