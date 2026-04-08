import { Router, Response, NextFunction } from "express";
import { reportService } from "../services";
import type { AuthRequest } from "../types";
import type { ReportType, ReportFormat } from "@prisma/client";
import { authenticate } from "../middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/generate",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { dateFrom, dateTo, category, format, userId } = req.query as Record<string, string>;

      if (!dateFrom || !dateTo) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "dateFrom and dateTo are required" } });
        return;
      }

      const validCategories = ["tasks", "issues", "feedback", "combined"];
      if (category && !validCategories.includes(category)) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "category must be one of: tasks, issues, feedback, combined" } });
        return;
      }

      const validFormats = ["pdf", "csv"];
      if (format && !validFormats.includes(format)) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "format must be one of: pdf, csv" } });
        return;
      }

      const result = await reportService.generateReport(
        req.user!.userId,
        req.user!.role,
        {
          dateFrom,
          dateTo,
          category: (category || "combined") as ReportType,
          format: (format || "pdf") as ReportFormat,
          userId,
        }
      );

      if (result.type === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
        res.send(result.content);
      } else {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
        result.stream.pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;
