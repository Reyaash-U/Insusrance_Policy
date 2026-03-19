import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const users = db.collection("users");

  // Remove existing admin if any
  await users.deleteOne({ email: "admin@insurex.com" });

  const hash = await bcrypt.hash("Admin@123", 12);

  await users.insertOne({
    firstName: "Admin",
    lastName: "User",
    email: "admin@insurex.com",
    password: hash,
    role: "admin",
    isEmailVerified: true,
    isActive: true,
    loginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Admin user created:");
  console.log("  Email:    admin@insurex.com");
  console.log("  Password: Admin@123");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
