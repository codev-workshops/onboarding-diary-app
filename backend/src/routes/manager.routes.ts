import { Router, Response, NextFunction } from "express";
import { managerService } from "../services";
import type { AuthRequest } from "../types";
import { authenticate, authorize } from "../middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("manager", "admin"));

router.get(
  "/dashboard",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await managerService.getManagerDashboard(req.user!.userId, req.user!.role);
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recruits",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const recruits = await managerService.getRecruitList(req.user!.userId, req.user!.role);
      res.json(recruits);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recruits/:recruitId/tasks",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await managerService.getRecruitTasks(
        req.user!.userId,
        req.user!.role,
        req.params.recruitId as string,
        req.query as Record<string, string>
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recruits/:recruitId/issues",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await managerService.getRecruitIssues(
        req.user!.userId,
        req.user!.role,
        req.params.recruitId as string,
        req.query as Record<string, string>
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recruits/:recruitId/feedback",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await managerService.getRecruitFeedback(
        req.user!.userId,
        req.user!.role,
        req.params.recruitId as string,
        req.query as Record<string, string>
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recruits/:recruitId/notes",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await managerService.getRecruitNotes(
        req.user!.userId,
        req.user!.role,
        req.params.recruitId as string,
        req.query as Record<string, string>
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
