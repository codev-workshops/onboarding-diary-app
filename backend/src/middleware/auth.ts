import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "../types";
import { verifyAccessToken, UnauthorizedError, ForbiddenError } from "../utils";

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid authorization header"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
