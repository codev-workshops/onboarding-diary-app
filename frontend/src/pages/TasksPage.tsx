import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type { Task, CreateTaskInput, UpdateTaskInput, PaginatedResponse, ApiErrorResponse, TaskCategory, TaskStatus, TaskPriority } from "../types";
import * as taskService from "../services/task.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "training", label: "Training" },
  { value: "documentation", label: "Documentation" },
  { value: "meeting", label: "Meeting" },
  { value: "setup", label: "Setup" },
  { value: "development", label: "Development" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const categoryFormOptions = categoryOptions.filter((o) => o.value !== "");
const statusFormOptions = statusOptions.filter((o) => o.value !== "");
const priorityFormOptions = priorityOptions.filter((o) => o.value !== "");

const statusColors: Record<TaskStatus, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
};

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600",
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<PaginatedResponse<Task>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [formDate, setFormDate] = useState(todayString());
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<TaskCategory>("training");
  const [formStatus, setFormStatus] = useState<TaskStatus>("not_started");
  const [formPriority, setFormPriority] = useState<TaskPriority>("medium");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), perPage: "10" };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterSearch) params.search = filterSearch;
      const result = await taskService.listTasks(params);
      setTasks(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterStatus, filterPriority, filterSearch]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function openCreateModal() {
    setEditingTask(null);
    setFormDate(todayString());
    setFormTitle("");
    setFormDescription("");
    setFormCategory("training");
    setFormStatus("not_started");
    setFormPriority("medium");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setFormDate(task.date.split("T")[0]);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormCategory(task.category);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (editingTask) {
        const input: UpdateTaskInput = {
          date: formDate,
          title: formTitle,
          description: formDescription || null,
          category: formCategory,
          status: formStatus,
          priority: formPriority,
        };
        await taskService.updateTask(editingTask.id, input);
      } else {
        const input: CreateTaskInput = {
          date: formDate,
          title: formTitle,
          description: formDescription || undefined,
          category: formCategory,
          status: formStatus,
          priority: formPriority,
        };
        await taskService.createTask(input);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save task");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await taskService.deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to delete task");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily onboarding tasks</p>
        </div>
        <Button onClick={openCreateModal}>+ New Task</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search tasks..."
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          />
          <Select
            options={categoryOptions}
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          />
          <Select
            options={priorityOptions}
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tasks...</div>
      ) : tasks.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tasks found</p>
          <Button onClick={openCreateModal}>Create your first task</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.items.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500">{formatDate(task.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                      {formatLabel(task.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {formatLabel(task.priority)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {formatLabel(task.category)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(task)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(task)}>
                    <span className="text-red-600">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={tasks.page}
            totalPages={tasks.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? "Edit Task" : "New Task"}
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
            placeholder="What did you work on?"
            required
            maxLength={200}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows={3}
              maxLength={5000}
            />
          </div>
          <Select
            label="Category"
            options={categoryFormOptions}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusFormOptions}
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
            />
            <Select
              label="Priority"
              options={priorityFormOptions}
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
