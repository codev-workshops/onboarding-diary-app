import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type { Feedback, CreateFeedbackInput, UpdateFeedbackInput, PaginatedResponse, ApiErrorResponse, FeedbackType } from "../types";
import * as feedbackService from "../services/feedback.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "positive", label: "Positive" },
  { value: "suggestion", label: "Suggestion" },
  { value: "concern", label: "Concern" },
];

const typeFormOptions = typeOptions.filter((o) => o.value !== "");

const typeColors: Record<FeedbackType, string> = {
  positive: "bg-green-100 text-green-700",
  suggestion: "bg-blue-100 text-blue-700",
  concern: "bg-orange-100 text-orange-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLabel(val: string): string {
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<PaginatedResponse<Feedback>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [formDate, setFormDate] = useState(todayString());
  const [formSubject, setFormSubject] = useState("");
  const [formType, setFormType] = useState<FeedbackType>("positive");
  const [formDetails, setFormDetails] = useState("");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), perPage: "10" };
      if (filterType) params.type = filterType;
      if (filterSearch) params.search = filterSearch;
      const result = await feedbackService.listFeedback(params);
      setFeedback(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterSearch]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  function openCreateModal() {
    setEditingFeedback(null);
    setFormDate(todayString());
    setFormSubject("");
    setFormType("positive");
    setFormDetails("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(fb: Feedback) {
    setEditingFeedback(fb);
    setFormDate(fb.date.split("T")[0]);
    setFormSubject(fb.subject);
    setFormType(fb.type);
    setFormDetails(fb.details);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (editingFeedback) {
        const input: UpdateFeedbackInput = {
          date: formDate,
          subject: formSubject,
          type: formType,
          details: formDetails,
        };
        await feedbackService.updateFeedback(editingFeedback.id, input);
      } else {
        const input: CreateFeedbackInput = {
          date: formDate,
          subject: formSubject,
          type: formType,
          details: formDetails,
        };
        await feedbackService.createFeedback(input);
      }
      setModalOpen(false);
      fetchFeedback();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save feedback");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await feedbackService.deleteFeedback(deleteTarget.id);
      setDeleteTarget(null);
      fetchFeedback();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to delete feedback");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Share your onboarding experience</p>
        </div>
        <Button onClick={openCreateModal}>+ New Feedback</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search feedback..."
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          />
          <Select
            options={typeOptions}
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Feedback list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading feedback...</div>
      ) : feedback.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No feedback found</p>
          <Button onClick={openCreateModal}>Submit your first feedback</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.items.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{fb.subject}</h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{fb.details}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500">{formatDate(fb.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${typeColors[fb.type]}`}>
                      {formatLabel(fb.type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(fb)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(fb)}>
                    <span className="text-red-600">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={feedback.page}
            totalPages={feedback.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFeedback ? "Edit Feedback" : "New Feedback"}
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
            label="Subject"
            value={formSubject}
            onChange={(e) => setFormSubject(e.target.value)}
            placeholder="Brief subject of your feedback"
            required
            maxLength={200}
          />
          <Select
            label="Type"
            options={typeFormOptions}
            value={formType}
            onChange={(e) => setFormType(e.target.value as FeedbackType)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Details</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formDetails}
              onChange={(e) => setFormDetails(e.target.value)}
              placeholder="Describe your feedback in detail..."
              rows={4}
              maxLength={5000}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingFeedback ? "Update Feedback" : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Feedback"
        message={`Are you sure you want to delete "${deleteTarget?.subject}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
