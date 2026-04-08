import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me",
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
};
