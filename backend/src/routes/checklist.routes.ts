import { Router, Response, NextFunction } from "express";
import { checklistService } from "../services";
import type { AuthRequest } from "../types";
import {
  authenticate,
  authorize,
  validateBody,
  isRequired,
  maxLength,
} from "../middleware";

const router = Router();

router.use(authenticate);

// ── Manager/Admin: Template CRUD ────────────────────────────────────

router.get(
  "/templates",
  authorize("manager", "admin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await checklistService.listTemplates(req.query as Record<string, string>);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/templates",
  authorize("manager", "admin"),
  validateBody((body) => [
    {
      field: "title",
      value: body.title,
      rules: [
        { check: isRequired, message: "Title is required" },
        { check: maxLength(200), message: "Title must be at most 200 characters" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const template = await checklistService.createTemplate(req.user!.userId, req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/templates/:id",
  authorize("manager", "admin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const template = await checklistService.getTemplateById(req.params.id as string);
      res.json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/templates/:id",
  authorize("manager", "admin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const template = await checklistService.updateTemplate(req.params.id as string, req.body);
      res.json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/templates/:id",
  authorize("manager", "admin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await checklistService.deleteTemplate(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ── Manager/Admin: Assign template to recruit ───────────────────────

router.post(
  "/templates/:id/assign",
  authorize("manager", "admin"),
  validateBody((body) => [
    {
      field: "recruitId",
      value: body.recruitId,
      rules: [
        { check: isRequired, message: "Recruit ID is required" },
      ],
    },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const assignment = await checklistService.assignToRecruit(
        req.user!.userId,
        req.params.id as string,
        req.body.recruitId
      );
      res.status(201).json(assignment);
    } catch (err) {
      next(err);
    }
  }
);

// ── Recruit: View own checklists ────────────────────────────────────

router.get(
  "/my",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const checklists = await checklistService.getMyChecklists(req.user!.userId);
      res.json(checklists);
    } catch (err) {
      next(err);
    }
  }
);

// ── Recruit: Toggle checklist item ──────────────────────────────────

router.patch(
  "/items/:itemId/toggle",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const item = await checklistService.toggleChecklistItem(req.user!.userId, req.params.itemId as string);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

// ── Dashboard progress ──────────────────────────────────────────────

router.get(
  "/progress",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const progress = await checklistService.getChecklistProgress(req.user!.userId);
      res.json(progress);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
