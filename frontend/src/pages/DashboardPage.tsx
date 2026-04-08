import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { DashboardData, ApiErrorResponse } from "../types";
import { useAuth } from "../hooks/useAuth";
import * as dashboardService from "../services/dashboard.service";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatLabel(val: string): string {
  return val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  open: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const typeColors: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  suggestion: "bg-blue-100 text-blue-700",
  concern: "bg-orange-100 text-orange-700",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiErrorResponse>;
        setError(axiosErr.response?.data?.error?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-medium">{user?.fullName}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div
          className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate("/tasks")}
        >
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalTasks}</p>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate("/tasks")}
        >
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.completedTasks}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${summary.taskCompletionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{summary.taskCompletionRate}% complete</p>
          </div>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate("/issues")}
        >
          <p className="text-sm text-gray-500">Open Issues</p>
          <p className={`text-2xl font-bold mt-1 ${summary.openIssues > 0 ? "text-red-600" : "text-gray-900"}`}>
            {summary.openIssues}
          </p>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate("/feedback")}
        >
          <p className="text-sm text-gray-500">Feedback</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalFeedback}</p>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate("/notes")}
        >
          <p className="text-sm text-gray-500">Notes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalNotes}</p>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => navigate("/tasks")}
            >
              View all
            </button>
          </div>
          {data.recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(task.date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${statusColors[task.status] || ""}`}>
                    {formatLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Issues</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => navigate("/issues")}
            >
              View all
            </button>
          </div>
          {data.recentIssues.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No issues yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(issue.date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${statusColors[issue.status] || ""}`}>
                    {formatLabel(issue.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Feedback</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => navigate("/feedback")}
            >
              View all
            </button>
          </div>
          {data.recentFeedback.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No feedback yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{fb.subject}</p>
                    <p className="text-xs text-gray-500">{formatDate(fb.date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${typeColors[fb.type] || ""}`}>
                    {formatLabel(fb.type)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Notes</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => navigate("/notes")}
            >
              View all
            </button>
          </div>
          {data.recentNotes.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No notes yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentNotes.map((note) => (
                <div key={note.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(note.date)}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{note.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
