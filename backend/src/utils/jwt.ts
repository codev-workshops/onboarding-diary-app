import jwt from "jsonwebtoken";
import { env } from "../config";
import { JwtPayload } from "../types";

function parseDuration(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes
  const num = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return 900;
  }
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload } as object,
    env.JWT_SECRET,
    { expiresIn: parseDuration(env.JWT_ACCESS_EXPIRY) }
  );
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload } as object,
    env.JWT_REFRESH_SECRET,
    { expiresIn: parseDuration(env.JWT_REFRESH_EXPIRY) }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
