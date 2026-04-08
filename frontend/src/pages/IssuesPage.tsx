import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type { Issue, CreateIssueInput, UpdateIssueInput, PaginatedResponse, ApiErrorResponse, IssueSeverity, IssueStatus } from "../types";
import * as issueService from "../services/issue.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const severityOptions = [
  { value: "", label: "All Severities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const severityFormOptions = severityOptions.filter((o) => o.value !== "");
const statusFormOptions = statusOptions.filter((o) => o.value !== "");

const severityColors: Record<IssueSeverity, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusColors: Record<IssueStatus, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

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

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<PaginatedResponse<Issue>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [formDate, setFormDate] = useState(todayString());
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSeverity, setFormSeverity] = useState<IssueSeverity>("medium");
  const [formStatus, setFormStatus] = useState<IssueStatus>("open");
  const [formResolutionNotes, setFormResolutionNotes] = useState("");

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), perPage: "10" };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterSearch) params.search = filterSearch;
      const result = await issueService.listIssues(params);
      setIssues(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [page, filterSeverity, filterStatus, filterSearch]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  function openCreateModal() {
    setEditingIssue(null);
    setFormDate(todayString());
    setFormTitle("");
    setFormDescription("");
    setFormSeverity("medium");
    setFormStatus("open");
    setFormResolutionNotes("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(issue: Issue) {
    setEditingIssue(issue);
    setFormDate(issue.date.split("T")[0]);
    setFormTitle(issue.title);
    setFormDescription(issue.description);
    setFormSeverity(issue.severity);
    setFormStatus(issue.status);
    setFormResolutionNotes(issue.resolutionNotes || "");
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (editingIssue) {
        const input: UpdateIssueInput = {
          date: formDate,
          title: formTitle,
          description: formDescription,
          severity: formSeverity,
          status: formStatus,
          resolutionNotes: formResolutionNotes || undefined,
        };
        await issueService.updateIssue(editingIssue.id, input);
      } else {
        const input: CreateIssueInput = {
          date: formDate,
          title: formTitle,
          description: formDescription,
          severity: formSeverity,
          status: formStatus,
          resolutionNotes: formResolutionNotes || undefined,
        };
        await issueService.createIssue(input);
      }
      setModalOpen(false);
      fetchIssues();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save issue");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await issueService.deleteIssue(deleteTarget.id);
      setDeleteTarget(null);
      fetchIssues();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to delete issue");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const showResolutionNotes = formStatus === "resolved" || formStatus === "closed";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500 mt-1">Log blockers and issues during onboarding</p>
        </div>
        <Button onClick={openCreateModal}>+ New Issue</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search issues..."
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          />
          <Select
            options={severityOptions}
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
          />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Issue list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading issues...</div>
      ) : issues.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No issues found</p>
          <Button onClick={openCreateModal}>Log your first issue</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.items.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{issue.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{issue.description}</p>
                  {issue.resolutionNotes && (
                    <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2 mb-2">
                      <span className="font-medium">Resolution:</span> {issue.resolutionNotes}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500">{formatDate(issue.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[issue.status]}`}>
                      {formatLabel(issue.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${severityColors[issue.severity]}`}>
                      {formatLabel(issue.severity)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(issue)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(issue)}>
                    <span className="text-red-600">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={issues.page}
            totalPages={issues.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIssue ? "Edit Issue" : "New Issue"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {formError}
            </div>
          )}
          <Input
            label="Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            required
          />
          <Input
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Brief description of the issue"
            required
            maxLength={200}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              maxLength={5000}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Severity"
              options={severityFormOptions}
              value={formSeverity}
              onChange={(e) => setFormSeverity(e.target.value as IssueSeverity)}
            />
            <Select
              label="Status"
              options={statusFormOptions}
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as IssueStatus)}
            />
          </div>
          {showResolutionNotes && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formResolutionNotes}
                onChange={(e) => setFormResolutionNotes(e.target.value)}
                placeholder="How was this issue resolved?"
                rows={3}
                maxLength={5000}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingIssue ? "Update Issue" : "Create Issue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Issue"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
