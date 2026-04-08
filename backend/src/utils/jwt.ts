import jwt from "jsonwebtoken";
import { env } from "../config";
import { JwtPayload } from "../types";

const ACCESS_EXPIRY_SECONDS = 900; // 15 minutes
const REFRESH_EXPIRY_SECONDS = 604800; // 7 days

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload } as object,
    env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY_SECONDS }
  );
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload } as object,
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY_SECONDS }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
