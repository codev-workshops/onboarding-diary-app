import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services";
import { AuthRequest } from "../types";
import { authenticate } from "../middleware";
import {
  validateBody,
  isRequired,
  isEmail,
  isValidPassword,
  minLength,
  maxLength,
  isOptional,
  isOneOf,
  isValidDate,
} from "../middleware";

const router = Router();

router.post(
  "/register",
  validateBody((body) => [
    {
      field: "email",
      value: body.email,
      rules: [
        { check: isRequired, message: "Email is required" },
        { check: isEmail, message: "Must be a valid email address" },
      ],
    },
    {
      field: "password",
      value: body.password,
      rules: [
        { check: isRequired, message: "Password is required" },
        {
          check: isValidPassword,
          message:
            "Password must be at least 8 characters with uppercase, lowercase, and a number",
        },
      ],
    },
    {
      field: "fullName",
      value: body.fullName,
      rules: [
        { check: isRequired, message: "Full name is required" },
        { check: minLength(2), message: "Full name must be at least 2 characters" },
        { check: maxLength(150), message: "Full name must be at most 150 characters" },
      ],
    },
    {
      field: "department",
      value: body.department,
      rules: [
        { check: isOptional(maxLength(100)), message: "Department must be at most 100 characters" },
      ],
    },
    {
      field: "startDate",
      value: body.startDate,
      rules: [
        { check: isOptional(isValidDate), message: "Start date must be a valid date" },
      ],
    },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  validateBody((body) => [
    {
      field: "email",
      value: body.email,
      rules: [
        { check: isRequired, message: "Email is required" },
        { check: isEmail, message: "Must be a valid email address" },
      ],
    },
    {
      field: "password",
      value: body.password,
      rules: [{ check: isRequired, message: "Password is required" }],
    },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/logout", authenticate, (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

router.post(
  "/refresh",
  validateBody((body) => [
    {
      field: "refreshToken",
      value: body.refreshToken,
      rules: [{ check: isRequired, message: "Refresh token is required" }],
    },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/profile",
  authenticate,
  validateBody((body) => [
    {
      field: "fullName",
      value: body.fullName,
      rules: [
        { check: isOptional(minLength(2)), message: "Full name must be at least 2 characters" },
        { check: isOptional(maxLength(150)), message: "Full name must be at most 150 characters" },
      ],
    },
    {
      field: "department",
      value: body.department,
      rules: [
        { check: isOptional(maxLength(100)), message: "Department must be at most 100 characters" },
      ],
    },
    {
      field: "startDate",
      value: body.startDate,
      rules: [
        { check: isOptional(isValidDate), message: "Start date must be a valid date" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/profile/password",
  authenticate,
  validateBody((body) => [
    {
      field: "currentPassword",
      value: body.currentPassword,
      rules: [{ check: isRequired, message: "Current password is required" }],
    },
    {
      field: "newPassword",
      value: body.newPassword,
      rules: [
        { check: isRequired, message: "New password is required" },
        {
          check: isValidPassword,
          message:
            "Password must be at least 8 characters with uppercase, lowercase, and a number",
        },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
