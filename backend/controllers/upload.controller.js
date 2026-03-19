import mongoose from "mongoose";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { getBucket } from "../config/gridfs.js";
import {
  uploadAvatar       as uploadAvatarToMongo,
  uploadPolicyThumbnail as uploadThumbnailToMongo,
  deleteFile,
} from "../services/upload.service.js";

// ─── Serve File ───────────────────────────────────────────────

/**
 * GET /api/files/:id
 * Public — streams a file from GridFS by its ObjectId.
 */
export const serveFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "Invalid file ID.");
  }

  const bucket = getBucket();
  const objectId = new mongoose.Types.ObjectId(id);

  // Find file metadata first to set Content-Type
  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files.length) {
    return sendError(res, 404, "File not found.");
  }

  const file = files[0];

  res.set("Content-Type", file.contentType || "application/octet-stream");
  res.set("Content-Length", file.length);
  res.set("Cache-Control", "public, max-age=31536000"); // 1 year cache

  bucket.openDownloadStream(objectId).pipe(res);
});

// ─── Upload Avatar ────────────────────────────────────────────

/**
 * PATCH /api/upload/avatar
 * Protected — any authenticated user.
 */
export const uploadUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, "No file uploaded. Send an image in the 'avatar' field.");
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from GridFS if it exists
  if (user.avatar && user.avatar.startsWith("/api/files/")) {
    const oldFileId = user.avatar.replace("/api/files/", "");
    await deleteFile(oldFileId);
  }

  const { url, fileId } = await uploadAvatarToMongo(
    req.file.buffer,
    req.file.mimetype,
    user._id.toString()
  );

  user.avatar = url;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Avatar updated successfully.", { avatar: url, fileId });
});

// ─── Delete File ──────────────────────────────────────────────

/**
 * DELETE /api/upload
 * Protected — Admin only.
 * Body: { fileId }
 */
export const deleteUpload = asyncHandler(async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return sendError(res, 400, "fileId is required.");
  }
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return sendError(res, 400, "Invalid fileId.");
  }

  await deleteFile(fileId);

  return sendSuccess(res, 200, "File deleted successfully.", { fileId });
});
