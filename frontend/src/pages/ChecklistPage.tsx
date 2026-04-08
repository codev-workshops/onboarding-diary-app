import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type { ChecklistTemplate, RecruitChecklist, PaginatedResponse, ApiErrorResponse, RecruitListItem } from "../types";
import { useAuth } from "../hooks/useAuth";
import * as checklistService from "../services/checklist.service";
import * as managerService from "../services/manager.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Manager Template Management ─────────────────────────────────────

function ManagerChecklistView() {
  const [templates, setTemplates] = useState<PaginatedResponse<ChecklistTemplate>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Template form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formItems, setFormItems] = useState<string[]>([""]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Assign
  const [assignTemplateId, setAssignTemplateId] = useState<string | null>(null);
  const [recruits, setRecruits] = useState<RecruitListItem[]>([]);
  const [assignRecruitId, setAssignRecruitId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Detail view
  const [detailTemplate, setDetailTemplate] = useState<ChecklistTemplate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await checklistService.listTemplates({ page: String(page), perPage: "10" });
      setTemplates(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreateModal() {
    setEditingTemplate(null);
    setFormTitle("");
    setFormDescription("");
    setFormItems([""]);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(template: ChecklistTemplate) {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDescription(template.description || "");
    setFormItems(template.items.map((i) => i.label));
    setFormError("");
    setModalOpen(true);
  }

  function addItem() {
    setFormItems([...formItems, ""]);
  }

  function removeItem(index: number) {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: string) {
    const updated = [...formItems];
    updated[index] = value;
    setFormItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const items = formItems.map((i) => i.trim()).filter(Boolean);
    if (items.length === 0) {
      setFormError("At least one checklist item is required");
      return;
    }

    setFormLoading(true);
    try {
      if (editingTemplate) {
        await checklistService.updateTemplate(editingTemplate.id, {
          title: formTitle,
          description: formDescription || undefined,
          items,
        });
      } else {
        await checklistService.createTemplate({
          title: formTitle,
          description: formDescription || undefined,
          items,
        });
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save template");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await checklistService.deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to delete template");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function openAssignModal(templateId: string) {
    setAssignTemplateId(templateId);
    setAssignRecruitId("");
    setAssignError("");
    try {
      const result = await managerService.getRecruitList();
      setRecruits(result);
    } catch {
      setRecruits([]);
    }
  }

  async function handleAssign() {
    if (!assignTemplateId || !assignRecruitId) return;
    setAssignLoading(true);
    setAssignError("");
    try {
      await checklistService.assignTemplate(assignTemplateId, assignRecruitId);
      setAssignTemplateId(null);
      fetchTemplates();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setAssignError(axiosErr.response?.data?.error?.message || "Failed to assign template");
    } finally {
      setAssignLoading(false);
    }
  }

  async function viewTemplateDetail(templateId: string) {
    setDetailLoading(true);
    try {
      const result = await checklistService.getTemplate(templateId);
      setDetailTemplate(result);
    } catch {
      // silently handle
    } finally {
      setDetailLoading(false);
    }
  }

  // Detail view
  if (detailTemplate) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setDetailTemplate(null)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{detailTemplate.title}</h1>
          {detailTemplate.description && (
            <p className="text-sm text-gray-500 mt-1">{detailTemplate.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Checklist Items ({detailTemplate.items.length})</h2>
            <div className="space-y-2">
              {detailTemplate.items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 py-1 text-sm">
                  <span className="text-gray-400 font-mono text-xs w-6">{idx + 1}.</span>
                  <span className="text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                Assigned Recruits ({detailTemplate.assignments?.length || 0})
              </h2>
              <Button size="sm" onClick={() => openAssignModal(detailTemplate.id)}>
                + Assign
              </Button>
            </div>
            {!detailTemplate.assignments || detailTemplate.assignments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No recruits assigned yet</p>
            ) : (
              <div className="space-y-2">
                {detailTemplate.assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {a.recruit.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.recruit.fullName}</p>
                      <p className="text-xs text-gray-500">{a.recruit.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage onboarding checklists for recruits</p>
        </div>
        <Button onClick={openCreateModal}>+ New Template</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : templates.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No checklist templates yet</p>
          <Button onClick={openCreateModal}>Create your first template</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.items.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => viewTemplateDetail(template.id)}
                >
                  <h3 className="font-medium text-gray-900">{template.title}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">{template.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                    <span className="text-gray-500">{formatDate(template.createdAt)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {template.items.length} items
                    </span>
                    <span className="text-gray-400">by {template.creator.fullName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openAssignModal(template.id)}>
                    Assign
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(template)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(template)}>
                    <span className="text-red-600">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={templates.page}
            totalPages={templates.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTemplate ? "Edit Template" : "New Checklist Template"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {formError}
            </div>
          )}
          <Input
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. Week 1 Onboarding Checklist"
            required
            maxLength={200}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe this checklist template..."
              rows={2}
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Checklist Items</label>
            {formItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={item}
                  onChange={(e) => updateItem(idx, e.target.value)}
                  placeholder="Enter checklist item..."
                  maxLength={300}
                />
                {formItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 text-sm p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Item
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all assignments. This action cannot be undone.`}
        loading={deleteLoading}
      />

      {/* Assign Modal */}
      <Modal
        open={!!assignTemplateId}
        onClose={() => setAssignTemplateId(null)}
        title="Assign to Recruit"
      >
        <div className="space-y-4">
          {assignError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {assignError}
            </div>
          )}
          {recruits.length === 0 ? (
            <p className="text-sm text-gray-500">No recruits available to assign</p>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Recruit</label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={assignRecruitId}
                onChange={(e) => setAssignRecruitId(e.target.value)}
              >
                <option value="">Choose a recruit...</option>
                {recruits.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName} ({r.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAssignTemplateId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              loading={assignLoading}
              disabled={!assignRecruitId}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Recruit Checklist View ──────────────────────────────────────────

function RecruitChecklistView() {
  const [checklists, setChecklists] = useState<RecruitChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await checklistService.getMyChecklists();
      setChecklists(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load checklists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  async function toggleItem(itemId: string) {
    try {
      await checklistService.toggleItem(itemId);
      fetchChecklists();
    } catch {
      // silently handle
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Checklists</h1>
        <p className="text-sm text-gray-500 mt-1">Track your onboarding progress</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading checklists...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No checklists assigned to you yet</div>
      ) : (
        <div className="space-y-6">
          {checklists.map((cl) => (
            <div key={cl.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{cl.template.title}</h2>
                  {cl.template.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{cl.template.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{cl.progressPercent}%</p>
                  <p className="text-xs text-gray-500">{cl.completedItems}/{cl.totalItems} done</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${cl.progressPercent === 100 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${cl.progressPercent}%` }}
                />
              </div>

              {/* Items */}
              <div className="space-y-1">
                {cl.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="flex items-center gap-3 w-full text-left py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {item.isCompleted && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        item.isCompleted ? "text-gray-400 line-through" : "text-gray-700"
                      }`}
                    >
                      {item.templateItem.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────

export default function ChecklistPage() {
  const { user } = useAuth();

  if (user?.role === "recruit") {
    return <RecruitChecklistView />;
  }

  return <ManagerChecklistView />;
}
