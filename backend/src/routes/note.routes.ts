import { Router, Response, NextFunction } from "express";
import { noteService } from "../services";
import type { AuthRequest } from "../types";
import {
  authenticate,
  validateBody,
  isRequired,
  maxLength,
  isValidDate,
  isOptional,
} from "../middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await noteService.listNotes(req.user!.userId, req.query as Record<string, string>);
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
      field: "content",
      value: body.content,
      rules: [
        { check: isRequired, message: "Content is required" },
        { check: maxLength(10000), message: "Content must be at most 10000 characters" },
      ],
    },
    {
      field: "tags",
      value: body.tags,
      rules: [
        {
          check: isOptional((v: unknown) => Array.isArray(v) && v.every((t) => typeof t === "string")),
          message: "Tags must be an array of strings",
        },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await noteService.createNote(req.user!.userId, req.body);
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await noteService.getNoteById(req.params.id as string, req.user!.userId);
      res.json(note);
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
      field: "content",
      value: body.content,
      rules: [
        { check: isOptional(maxLength(10000)), message: "Content must be at most 10000 characters" },
      ],
    },
    {
      field: "tags",
      value: body.tags,
      rules: [
        {
          check: isOptional((v: unknown) => Array.isArray(v) && v.every((t) => typeof t === "string")),
          message: "Tags must be an array of strings",
        },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await noteService.updateNote(req.params.id as string, req.user!.userId, req.body);
      res.json(note);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await noteService.deleteNote(req.params.id as string, req.user!.userId);
      res.json({ message: "Note deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
