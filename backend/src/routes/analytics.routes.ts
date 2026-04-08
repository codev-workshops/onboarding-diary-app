import { Router, Response, NextFunction } from "express";
import { analyticsService } from "../services";
import type { AuthRequest } from "../types";
import { authenticate, authorize } from "../middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("manager", "admin"));

router.get(
  "/manager",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const analytics = await analyticsService.getManagerAnalytics(req.user!.userId, req.user!.role);
      res.json(analytics);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
