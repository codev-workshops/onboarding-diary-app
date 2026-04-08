import { Router, Response, NextFunction } from "express";
import { feedbackService } from "../services";
import type { AuthRequest } from "../types";
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
      const result = await feedbackService.listFeedback(req.user!.userId, req.query as Record<string, string>);
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
      field: "subject",
      value: body.subject,
      rules: [
        { check: isRequired, message: "Subject is required" },
        { check: maxLength(200), message: "Subject must be at most 200 characters" },
      ],
    },
    {
      field: "type",
      value: body.type,
      rules: [
        { check: isRequired, message: "Type is required" },
        {
          check: isOneOf(["positive", "suggestion", "concern"]),
          message: "Type must be one of: positive, suggestion, concern",
        },
      ],
    },
    {
      field: "details",
      value: body.details,
      rules: [
        { check: isRequired, message: "Details are required" },
        { check: maxLength(5000), message: "Details must be at most 5000 characters" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const feedback = await feedbackService.createFeedback(req.user!.userId, req.body);
      res.status(201).json(feedback);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const feedback = await feedbackService.getFeedbackById(req.params.id as string, req.user!.userId);
      res.json(feedback);
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
      field: "subject",
      value: body.subject,
      rules: [
        { check: isOptional(maxLength(200)), message: "Subject must be at most 200 characters" },
      ],
    },
    {
      field: "type",
      value: body.type,
      rules: [
        {
          check: isOptional(isOneOf(["positive", "suggestion", "concern"])),
          message: "Type must be one of: positive, suggestion, concern",
        },
      ],
    },
    {
      field: "details",
      value: body.details,
      rules: [
        { check: isOptional(maxLength(5000)), message: "Details must be at most 5000 characters" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const feedback = await feedbackService.updateFeedback(req.params.id as string, req.user!.userId, req.body);
      res.json(feedback);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await feedbackService.deleteFeedback(req.params.id as string, req.user!.userId);
      res.json({ message: "Feedback deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
