import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type {
  ManagerDashboardData,
  ApiErrorResponse,
  Task,
  Issue,
  Feedback,
  Note,
  PaginatedResponse,
} from "../types";
import * as managerService from "../services/manager.service";
import Pagination from "../components/ui/Pagination";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
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

type TabType = "tasks" | "issues" | "feedback" | "notes";

export default function ManagerPage() {
  const [dashboard, setDashboard] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recruit detail view
  const [selectedRecruitId, setSelectedRecruitId] = useState<string | null>(null);
  const [selectedRecruitName, setSelectedRecruitName] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

  // Recruit data
  const [tasks, setTasks] = useState<PaginatedResponse<Task>>({ items: [], total: 0, page: 1, perPage: 10, totalPages: 0 });
  const [issues, setIssues] = useState<PaginatedResponse<Issue>>({ items: [], total: 0, page: 1, perPage: 10, totalPages: 0 });
  const [feedback, setFeedback] = useState<PaginatedResponse<Feedback>>({ items: [], total: 0, page: 1, perPage: 10, totalPages: 0 });
  const [notes, setNotes] = useState<PaginatedResponse<Note>>({ items: [], total: 0, page: 1, perPage: 10, totalPages: 0 });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await managerService.getManagerDashboard();
        setDashboard(result);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiErrorResponse>;
        setError(axiosErr.response?.data?.error?.message || "Failed to load manager dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const fetchRecruitData = useCallback(async () => {
    if (!selectedRecruitId) return;
    setDetailLoading(true);
    try {
      const params = { page: String(detailPage), perPage: "10" };
      switch (activeTab) {
        case "tasks": {
          const result = await managerService.getRecruitTasks(selectedRecruitId, params);
          setTasks(result);
          break;
        }
        case "issues": {
          const result = await managerService.getRecruitIssues(selectedRecruitId, params);
          setIssues(result);
          break;
        }
        case "feedback": {
          const result = await managerService.getRecruitFeedback(selectedRecruitId, params);
          setFeedback(result);
          break;
        }
        case "notes": {
          const result = await managerService.getRecruitNotes(selectedRecruitId, params);
          setNotes(result);
          break;
        }
      }
    } catch {
      // Silently handle errors for detail view
    } finally {
      setDetailLoading(false);
    }
  }, [selectedRecruitId, activeTab, detailPage]);

  useEffect(() => {
    fetchRecruitData();
  }, [fetchRecruitData]);

  function selectRecruit(id: string, name: string) {
    setSelectedRecruitId(id);
    setSelectedRecruitName(name);
    setActiveTab("tasks");
    setDetailPage(1);
  }

  function backToDashboard() {
    setSelectedRecruitId(null);
    setSelectedRecruitName("");
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading manager dashboard...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>;
  }

  if (!dashboard) return null;

  // Recruit detail view
  if (selectedRecruitId) {
    const tabs: TabType[] = ["tasks", "issues", "feedback", "notes"];

    const getCurrentData = () => {
      switch (activeTab) {
        case "tasks": return tasks;
        case "issues": return issues;
        case "feedback": return feedback;
        case "notes": return notes;
      }
    };

    const currentData = getCurrentData();

    return (
      <div>
        <div className="mb-6">
          <button
            onClick={backToDashboard}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedRecruitName}</h1>
          <p className="text-sm text-gray-500 mt-1">Viewing recruit&apos;s onboarding entries</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setDetailPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {formatLabel(tab)}
            </button>
          ))}
        </div>

        {/* Content */}
        {detailLoading ? (
          <div className="text-center py-12 text-gray-500">Loading {activeTab}...</div>
        ) : currentData.items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {activeTab} found</div>
        ) : (
          <div className="space-y-3">
            {activeTab === "tasks" && tasks.items.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                      <span className="text-gray-500">{formatDate(task.date)}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || ""}`}>
                        {formatLabel(task.status)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        {formatLabel(task.category)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "issues" && issues.items.map((issue) => (
              <div key={issue.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{issue.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{issue.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                    <span className="text-gray-500">{formatDate(issue.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[issue.status] || ""}`}>
                      {formatLabel(issue.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                      {formatLabel(issue.severity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "feedback" && feedback.items.map((fb) => (
              <div key={fb.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{fb.subject}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{fb.details}</p>
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="text-gray-500">{formatDate(fb.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${typeColors[fb.type] || ""}`}>
                      {formatLabel(fb.type)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "notes" && notes.items.map((note) => (
              <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{note.content}</p>
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="text-gray-500">{formatDate(note.date)}</span>
                    {note.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <Pagination
              page={currentData.page}
              totalPages={currentData.totalPages}
              onPageChange={setDetailPage}
            />
          </div>
        )}
      </div>
    );
  }

  // Manager dashboard view
  const { aggregate } = dashboard;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your assigned recruits</p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Recruits</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{aggregate.totalRecruits}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Task Completion</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{aggregate.avgTaskCompletionRate}%</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${aggregate.avgTaskCompletionRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Open Issues</p>
          <p className={`text-2xl font-bold mt-1 ${aggregate.totalOpenIssues > 0 ? "text-red-600" : "text-gray-900"}`}>
            {aggregate.totalOpenIssues}
          </p>
        </div>
      </div>

      {/* Recruit List */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruits</h2>
      {dashboard.recruits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No recruits assigned to you</div>
      ) : (
        <div className="space-y-3">
          {dashboard.recruits.map((recruit) => (
            <div
              key={recruit.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => selectRecruit(recruit.id, recruit.fullName)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {recruit.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{recruit.fullName}</h3>
                      <p className="text-xs text-gray-500">{recruit.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{recruit.totalTasks}</p>
                    <p className="text-xs text-gray-500">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{recruit.taskCompletionRate}%</p>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${recruit.openIssues > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {recruit.openIssues}
                    </p>
                    <p className="text-xs text-gray-500">Issues</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
