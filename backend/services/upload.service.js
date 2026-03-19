import streamifier from "streamifier";
import mongoose from "mongoose";
import { getBucket } from "../config/gridfs.js";
import logger from "../utils/logger.js";

// ─── MIME Type Maps ───────────────────────────────────────────

export const MIME_GROUPS = {
  image:    ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video:    ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf"],
};

export const ALL_ALLOWED_MIMES = [
  ...MIME_GROUPS.image,
  ...MIME_GROUPS.video,
  ...MIME_GROUPS.document,
];

export const AVATAR_MIMES = MIME_GROUPS.image;

/**
 * Resolve human-readable resource type from MIME.
 */
export const getResourceType = (mimetype) => {
  if (MIME_GROUPS.image.includes(mimetype))    return "image";
  if (MIME_GROUPS.video.includes(mimetype))    return "video";
  return "raw";
};

// ─── Core Save ────────────────────────────────────────────────

/**
 * Save a file buffer to MongoDB GridFS.
 *
 * @param {Buffer} buffer
 * @param {string} filename      - Stored filename in GridFS
 * @param {string} mimetype
 * @param {object} metadata      - Extra metadata (uploadedBy, type, etc.)
 * @returns {Promise<ObjectId>}  - GridFS file _id
 */
export const saveToGridFS = (buffer, filename, mimetype, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata,
    });

    streamifier
      .createReadStream(buffer)
      .pipe(uploadStream)
      .on("error", (err) => {
        logger.error(`GridFS upload failed [${filename}]: ${err.message}`);
        reject(new Error("File upload failed. Please try again."));
      })
      .on("finish", () => {
        logger.info(`GridFS upload success [${filename}]: ${uploadStream.id}`);
        resolve(uploadStream.id);
      });
  });
};

// ─── Specialised Uploaders ────────────────────────────────────

/**
 * Upload a user avatar.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} userId
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export const uploadAvatar = async (buffer, mimetype, userId) => {
  const fileId = await saveToGridFS(
    buffer,
    `avatar_${userId}`,
    mimetype,
    { type: "avatar", uploadedBy: userId }
  );
  return {
    url:    `/api/files/${fileId}`,
    fileId: fileId.toString(),
  };
};

/**
 * Upload a policy thumbnail.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} [policyId]
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export const uploadPolicyThumbnail = async (buffer, mimetype, policyId = "new") => {
  const fileId = await saveToGridFS(
    buffer,
    `policy_thumbnail_${policyId}_${Date.now()}`,
    mimetype,
    { type: "policyThumbnail", policyId }
  );
  return {
    url:    `/api/files/${fileId}`,
    fileId: fileId.toString(),
  };
};

/**
 * Upload a single claim attachment (image, video, or PDF).
 * @param {object} file        - Multer file { buffer, mimetype, originalname, size }
 * @param {string} claimNumber - e.g. "CLM-2026-000001"
 * @returns {Promise<object>}  - Attachment document
 */
export const uploadClaimAttachment = async (file, claimNumber) => {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${claimNumber}_${Date.now()}_${safeName}`;

  const fileId = await saveToGridFS(
    file.buffer,
    filename,
    file.mimetype,
    { type: "claimAttachment", claimNumber, originalName: file.originalname }
  );

  return {
    url:          `/api/files/${fileId}`,
    fileId:       fileId.toString(),
    resourceType: getResourceType(file.mimetype),
    originalName: file.originalname,
    sizeBytes:    file.size,
    uploadedAt:   new Date(),
  };
};

/**
 * Upload multiple claim attachments in parallel.
 * @param {Express.Multer.File[]} files
 * @param {string} claimNumber
 * @returns {Promise<object[]>}
 */
export const uploadMultipleFiles = async (files = [], claimNumber = "misc") => {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadClaimAttachment(file, claimNumber)));
};

// ─── Deletion ─────────────────────────────────────────────────

/**
 * Delete a file from GridFS by its _id string.
 * @param {string} fileId
 */
export const deleteFile = async (fileId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) return;
    const bucket = getBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    logger.info(`GridFS deleted: ${fileId}`);
  } catch (err) {
    // Non-fatal — file may already be gone
    logger.error(`GridFS delete failed [${fileId}]: ${err.message}`);
  }
};

/**
 * Delete multiple files from GridFS.
 * @param {Array<{ fileId: string }>} attachments
 */
export const deleteMultipleFiles = async (attachments = []) => {
  await Promise.all(attachments.map((att) => deleteFile(att.fileId)));
};
