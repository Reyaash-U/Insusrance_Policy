import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error("MONGO_URI is not set. Add it to backend/.env before starting the server.");
    process.exit(1);
  }

  const connectOptions = {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  };

  // Force IPv4 only when needed (useful on some Windows/DNS setups with Atlas SRV).
  if (process.env.MONGO_FORCE_IPV4 === "true") {
    connectOptions.family = 4;
  }

  try {
    const conn = await mongoose.connect(mongoUri, connectOptions);

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    logger.error(`MongoDB initial connection failed: ${error.message}`);

    if (
      /whitelist|ip|not allowed|server selection|could not connect to any servers/i.test(
        error.message
      )
    ) {
      logger.error(
        "Atlas access issue detected. Verify Network Access allowlist and database user credentials in Atlas."
      );
    }

    if (/querysrv|enotfound|etimeout|dns/i.test(error.message)) {
      logger.error(
        "DNS/SRV lookup issue detected. Try setting MONGO_FORCE_IPV4=true in backend/.env and retry."
      );
    }

    process.exit(1);
  }
};

export default connectDB;
