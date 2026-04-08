import { Router } from "express";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import issueRoutes from "./issue.routes";
import feedbackRoutes from "./feedback.routes";
import noteRoutes from "./note.routes";
import dashboardRoutes from "./dashboard.routes";
import reportRoutes from "./report.routes";
import managerRoutes from "./manager.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/issues", issueRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/notes", noteRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/manager", managerRoutes);
router.use("/admin", adminRoutes);

export default router;
