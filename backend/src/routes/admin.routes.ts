import { Router, Response, NextFunction } from "express";
import { adminService } from "../services";
import type { AuthRequest } from "../types";
import type { Role } from "@prisma/client";
import {
  authenticate,
  authorize,
  validateBody,
  isRequired,
  isEmail,
  isValidPassword,
  maxLength,
  isOneOf,
  isOptional,
  isValidDate,
} from "../middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

router.get(
  "/dashboard",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await adminService.getAdminDashboard();
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.listUsers(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/managers",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const managers = await adminService.getManagers();
      res.json(managers);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/users",
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
        { check: isValidPassword, message: "Password must be at least 8 characters with uppercase, lowercase, and a number" },
      ],
    },
    {
      field: "fullName",
      value: body.fullName,
      rules: [
        { check: isRequired, message: "Full name is required" },
        { check: maxLength(150), message: "Full name must be at most 150 characters" },
      ],
    },
    {
      field: "role",
      value: body.role,
      rules: [
        { check: isRequired, message: "Role is required" },
        { check: isOneOf(["recruit", "manager", "admin"]), message: "Role must be one of: recruit, manager, admin" },
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
        { check: isOptional(isValidDate), message: "Must be a valid date (YYYY-MM-DD)" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.getUserById(req.params.id as string);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:id",
  validateBody((body) => [
    {
      field: "fullName",
      value: body.fullName,
      rules: [
        { check: isOptional(maxLength(150)), message: "Full name must be at most 150 characters" },
      ],
    },
    {
      field: "role",
      value: body.role,
      rules: [
        {
          check: isOptional(isOneOf(["recruit", "manager", "admin"])),
          message: "Role must be one of: recruit, manager, admin",
        },
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
        { check: isOptional(isValidDate), message: "Must be a valid date (YYYY-MM-DD)" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.updateUser(req.params.id as string, req.body as { fullName?: string; role?: Role; department?: string; startDate?: string });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:id/status",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.toggleUserStatus(req.params.id as string);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:id/assign-manager",
  validateBody((body) => [
    {
      field: "managerId",
      value: body.managerId,
      rules: [],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.assignManager(
        req.params.id as string,
        req.body.managerId || null
      );
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
