import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type { Note, CreateNoteInput, UpdateNoteInput, PaginatedResponse, ApiErrorResponse } from "../types";
import * as noteService from "../services/note.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NotesPage() {
  const [notes, setNotes] = useState<PaginatedResponse<Note>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterTags, setFilterTags] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form fields
  const [formDate, setFormDate] = useState(todayString());
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), perPage: "10" };
      if (filterSearch) params.search = filterSearch;
      if (filterTags) params.tags = filterTags;
      const result = await noteService.listNotes(params);
      setNotes(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [page, filterSearch, filterTags]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  function openCreateModal() {
    setEditingNote(null);
    setFormDate(todayString());
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(note: Note) {
    setEditingNote(note);
    setFormDate(note.date.split("T")[0]);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormTags(note.tags.join(", "));
    setFormError("");
    setModalOpen(true);
  }

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const tags = parseTags(formTags);
      if (editingNote) {
        const input: UpdateNoteInput = {
          date: formDate,
          title: formTitle,
          content: formContent,
          tags,
        };
        await noteService.updateNote(editingNote.id, input);
      } else {
        const input: CreateNoteInput = {
          date: formDate,
          title: formTitle,
          content: formContent,
          tags,
        };
        await noteService.createNote(input);
      }
      setModalOpen(false);
      fetchNotes();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save note");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await noteService.deleteNote(deleteTarget.id);
      setDeleteTarget(null);
      fetchNotes();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to delete note");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Capture thoughts and learnings</p>
        </div>
        <Button onClick={openCreateModal}>+ New Note</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search notes..."
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          />
          <Input
            placeholder="Filter by tags (comma-separated)..."
            value={filterTags}
            onChange={(e) => { setFilterTags(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notes...</div>
      ) : notes.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No notes found</p>
          <Button onClick={openCreateModal}>Create your first note</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.items.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{note.content}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500">{formatDate(note.date)}</span>
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(note)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(note)}>
                    <span className="text-red-600">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={notes.page}
            totalPages={notes.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNote ? "Edit Note" : "New Note"}
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
            placeholder="Note title"
            required
            maxLength={200}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Write your note here..."
              rows={5}
              maxLength={10000}
              required
            />
          </div>
          <Input
            label="Tags (comma-separated)"
            value={formTags}
            onChange={(e) => setFormTags(e.target.value)}
            placeholder="e.g. onboarding, setup, tips"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingNote ? "Update Note" : "Create Note"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
