import { Router, Response, NextFunction } from "express";
import { dashboardService } from "../services";
import type { AuthRequest } from "../types";
import { authenticate } from "../middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await dashboardService.getDashboard(req.user!.userId);
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
