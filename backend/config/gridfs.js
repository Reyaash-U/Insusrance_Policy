import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

let bucket = null;

/**
 * Initialise GridFS bucket. Must be called AFTER mongoose.connect() resolves.
 */
export const initGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error("Cannot initialise GridFS before database connection.");
  }
  bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
  logger.info("GridFS bucket initialised.");
  return bucket;
};

/**
 * Returns the GridFS bucket. Throws if not yet initialised.
 */
export const getBucket = () => {
  if (!bucket) throw new Error("GridFS bucket not initialised. Call initGridFS() first.");
  return bucket;
};
