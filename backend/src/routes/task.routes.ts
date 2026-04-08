import { Router, Response, NextFunction } from "express";
import { taskService } from "../services";
import { AuthRequest } from "../types";
import {
  authenticate,
  validateBody,
  isRequired,
  maxLength,
  isOneOf,
  isValidDate,
  isOptional,
} from "../middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await taskService.listTasks(req.user!.userId, req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  validateBody((body) => [
    {
      field: "date",
      value: body.date,
      rules: [
        { check: isRequired, message: "Date is required" },
        { check: isValidDate, message: "Must be a valid date (YYYY-MM-DD)" },
      ],
    },
    {
      field: "title",
      value: body.title,
      rules: [
        { check: isRequired, message: "Title is required" },
        { check: maxLength(200), message: "Title must be at most 200 characters" },
      ],
    },
    {
      field: "description",
      value: body.description,
      rules: [
        { check: isOptional(maxLength(5000)), message: "Description must be at most 5000 characters" },
      ],
    },
    {
      field: "category",
      value: body.category,
      rules: [
        { check: isRequired, message: "Category is required" },
        {
          check: isOneOf(["training", "documentation", "meeting", "setup", "development", "other"]),
          message: "Category must be one of: training, documentation, meeting, setup, development, other",
        },
      ],
    },
    {
      field: "status",
      value: body.status,
      rules: [
        {
          check: isOptional(isOneOf(["not_started", "in_progress", "completed", "on_hold"])),
          message: "Status must be one of: not_started, in_progress, completed, on_hold",
        },
      ],
    },
    {
      field: "priority",
      value: body.priority,
      rules: [
        {
          check: isOptional(isOneOf(["low", "medium", "high", "critical"])),
          message: "Priority must be one of: low, medium, high, critical",
        },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.userId, req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTaskById(req.params.id as string, req.user!.userId);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  validateBody((body) => [
    {
      field: "date",
      value: body.date,
      rules: [
        { check: isOptional(isValidDate), message: "Must be a valid date (YYYY-MM-DD)" },
      ],
    },
    {
      field: "title",
      value: body.title,
      rules: [
        { check: isOptional(maxLength(200)), message: "Title must be at most 200 characters" },
      ],
    },
    {
      field: "description",
      value: body.description,
      rules: [
        { check: isOptional(maxLength(5000)), message: "Description must be at most 5000 characters" },
      ],
    },
    {
      field: "category",
      value: body.category,
      rules: [
        {
          check: isOptional(isOneOf(["training", "documentation", "meeting", "setup", "development", "other"])),
          message: "Category must be one of: training, documentation, meeting, setup, development, other",
        },
      ],
    },
    {
      field: "status",
      value: body.status,
      rules: [
        {
          check: isOptional(isOneOf(["not_started", "in_progress", "completed", "on_hold"])),
          message: "Status must be one of: not_started, in_progress, completed, on_hold",
        },
      ],
    },
    {
      field: "priority",
      value: body.priority,
      rules: [
        {
          check: isOptional(isOneOf(["low", "medium", "high", "critical"])),
          message: "Priority must be one of: low, medium, high, critical",
        },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateTask(req.params.id as string, req.user!.userId, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await taskService.deleteTask(req.params.id as string, req.user!.userId);
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
