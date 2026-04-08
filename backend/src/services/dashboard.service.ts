import { prisma } from "../config";

export async function getDashboard(userId: string) {
  const [
    totalTasks,
    completedTasks,
    openIssues,
    totalFeedback,
    totalNotes,
    recentTasks,
    recentIssues,
    recentFeedback,
    recentNotes,
  ] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "completed" } }),
    prisma.issue.count({ where: { userId, status: { in: ["open", "in_progress"] } } }),
    prisma.feedback.count({ where: { userId } }),
    prisma.note.count({ where: { userId } }),
    prisma.task.findMany({
      where: { userId },
      select: { id: true, date: true, title: true, status: true, priority: true, category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.issue.findMany({
      where: { userId },
      select: { id: true, date: true, title: true, status: true, severity: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.feedback.findMany({
      where: { userId },
      select: { id: true, date: true, subject: true, type: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.note.findMany({
      where: { userId },
      select: { id: true, date: true, title: true, tags: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    summary: {
      totalTasks,
      completedTasks,
      openIssues,
      totalFeedback,
      totalNotes,
      taskCompletionRate,
    },
    recentTasks,
    recentIssues,
    recentFeedback,
    recentNotes,
  };
}
