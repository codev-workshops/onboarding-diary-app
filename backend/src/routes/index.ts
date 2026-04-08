import { Router } from "express";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import issueRoutes from "./issue.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/issues", issueRoutes);

export default router;
