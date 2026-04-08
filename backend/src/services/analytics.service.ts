import { prisma } from "../config";
import { ForbiddenError, NotFoundError } from "../utils";

export async function getManagerAnalytics(managerId: string, callerRole: string) {
  const where = callerRole === "admin"
    ? { role: "recruit" as const }
    : { managerId, role: "recruit" as const };

  const recruits = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  const recruitIds = recruits.map((r) => r.id);

  if (recruitIds.length === 0) {
    return {
      tasksOverTime: [],
      issuesBySeverity: [],
      feedbackSentiment: [],
    };
  }

  // Tasks completed over time (last 30 days, grouped by date)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: recruitIds },
      date: { gte: thirtyDaysAgo },
    },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  });

  const tasksByDate: Record<string, { total: number; completed: number }> = {};
  for (const task of tasks) {
    const dateKey = new Date(task.date).toISOString().split("T")[0];
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = { total: 0, completed: 0 };
    }
    tasksByDate[dateKey].total += 1;
    if (task.status === "completed") {
      tasksByDate[dateKey].completed += 1;
    }
  }

  const tasksOverTime = Object.entries(tasksByDate).map(([date, counts]) => ({
    date,
    total: counts.total,
    completed: counts.completed,
  }));

  // Issues by severity
  const issuesBySeverity = await Promise.all(
    (["low", "medium", "high", "critical"] as const).map(async (severity) => {
      const count = await prisma.issue.count({
        where: { userId: { in: recruitIds }, severity },
      });
      return { severity, count };
    })
  );

  // Feedback sentiment breakdown
  const feedbackSentiment = await Promise.all(
    (["positive", "suggestion", "concern"] as const).map(async (type) => {
      const count = await prisma.feedback.count({
        where: { userId: { in: recruitIds }, type },
      });
      return { type, count };
    })
  );

  return {
    tasksOverTime,
    issuesBySeverity,
    feedbackSentiment,
  };
}
