import { Router, Response, NextFunction } from "express";
import { issueService } from "../services";
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
      const result = await issueService.listIssues(req.user!.userId, req.query as Record<string, string>);
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
        { check: isRequired, message: "Description is required" },
        { check: maxLength(5000), message: "Description must be at most 5000 characters" },
      ],
    },
    {
      field: "severity",
      value: body.severity,
      rules: [
        { check: isRequired, message: "Severity is required" },
        {
          check: isOneOf(["low", "medium", "high", "critical"]),
          message: "Severity must be one of: low, medium, high, critical",
        },
      ],
    },
    {
      field: "status",
      value: body.status,
      rules: [
        {
          check: isOptional(isOneOf(["open", "in_progress", "resolved", "closed"])),
          message: "Status must be one of: open, in_progress, resolved, closed",
        },
      ],
    },
    {
      field: "resolutionNotes",
      value: body.resolutionNotes,
      rules: [
        { check: isOptional(maxLength(5000)), message: "Resolution notes must be at most 5000 characters" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.createIssue(req.user!.userId, req.body);
      res.status(201).json(issue);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.getIssueById(req.params.id as string, req.user!.userId);
      res.json(issue);
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
      field: "severity",
      value: body.severity,
      rules: [
        {
          check: isOptional(isOneOf(["low", "medium", "high", "critical"])),
          message: "Severity must be one of: low, medium, high, critical",
        },
      ],
    },
    {
      field: "status",
      value: body.status,
      rules: [
        {
          check: isOptional(isOneOf(["open", "in_progress", "resolved", "closed"])),
          message: "Status must be one of: open, in_progress, resolved, closed",
        },
      ],
    },
    {
      field: "resolutionNotes",
      value: body.resolutionNotes,
      rules: [
        { check: isOptional(maxLength(5000)), message: "Resolution notes must be at most 5000 characters" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.updateIssue(req.params.id as string, req.user!.userId, req.body);
      res.json(issue);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await issueService.deleteIssue(req.params.id as string, req.user!.userId);
      res.json({ message: "Issue deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
