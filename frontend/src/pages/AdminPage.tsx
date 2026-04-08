import { useState, useEffect, useCallback } from "react";
import type { AxiosError } from "axios";
import type {
  AdminUser,
  AdminDashboardData,
  CreateUserInput,
  UpdateUserInput,
  PaginatedResponse,
  ApiErrorResponse,
  ManagerOption,
  Role,
} from "../types";
import * as adminService from "../services/admin.service";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "recruit", label: "Recruit" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const activeOptions = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const roleFormOptions = roleOptions.filter((o) => o.value !== "");

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

const roleColors: Record<string, string> = {
  recruit: "bg-blue-100 text-blue-700",
  manager: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<PaginatedResponse<AdminUser>>({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRole, setFormRole] = useState<Role>("recruit");
  const [formDepartment, setFormDepartment] = useState("");
  const [formStartDate, setFormStartDate] = useState("");

  // Toggle status
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Assign manager modal
  const [assignTarget, setAssignTarget] = useState<AdminUser | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), perPage: "10" };
      if (filterRole) params.role = filterRole;
      if (filterActive) params.isActive = filterActive;
      if (filterSearch) params.search = filterSearch;
      const result = await adminService.listUsers(params);
      setUsers(result);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, filterActive, filterSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    adminService.getAdminDashboard().then(setDashboardData).catch(() => {});
    adminService.getManagers().then(setManagers).catch(() => {});
  }, []);

  function openCreateModal() {
    setEditingUser(null);
    setFormEmail("");
    setFormPassword("");
    setFormFullName("");
    setFormRole("recruit");
    setFormDepartment("");
    setFormStartDate("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormPassword("");
    setFormFullName(user.fullName);
    setFormRole(user.role);
    setFormDepartment(user.department || "");
    setFormStartDate(user.startDate ? user.startDate.split("T")[0] : "");
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (editingUser) {
        const input: UpdateUserInput = {
          fullName: formFullName,
          role: formRole,
          department: formDepartment || undefined,
          startDate: formStartDate || undefined,
        };
        await adminService.updateUser(editingUser.id, input);
      } else {
        const input: CreateUserInput = {
          email: formEmail,
          password: formPassword,
          fullName: formFullName,
          role: formRole,
          department: formDepartment || undefined,
          startDate: formStartDate || undefined,
        };
        await adminService.createUser(input);
      }
      setModalOpen(false);
      fetchUsers();
      adminService.getAdminDashboard().then(setDashboardData).catch(() => {});
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setFormError(axiosErr.response?.data?.error?.message || "Failed to save user");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      await adminService.toggleUserStatus(toggleTarget.id);
      setToggleTarget(null);
      fetchUsers();
      adminService.getAdminDashboard().then(setDashboardData).catch(() => {});
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to toggle user status");
      setToggleTarget(null);
    } finally {
      setToggleLoading(false);
    }
  }

  function openAssignManager(user: AdminUser) {
    setAssignTarget(user);
    setSelectedManagerId(user.managerId || "");
  }

  async function handleAssignManager(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    setAssignLoading(true);
    try {
      await adminService.assignManager(assignTarget.id, selectedManagerId || null);
      setAssignTarget(null);
      fetchUsers();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message || "Failed to assign manager");
      setAssignTarget(null);
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users, roles, and assignments</p>
        </div>
        <Button onClick={openCreateModal}>+ New User</Button>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.users.total}</p>
            <p className="text-xs text-gray-400 mt-1">
              {dashboardData.users.active} active, {dashboardData.users.inactive} inactive
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Recruits</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{dashboardData.users.byRole.recruit}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Managers</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{dashboardData.users.byRole.manager}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Task Completion</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{dashboardData.entries.taskCompletionRate}%</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${dashboardData.entries.taskCompletionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search users..."
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          />
          <Select
            options={roleOptions}
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          />
          <Select
            options={activeOptions}
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* User list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : users.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No users found</p>
          <Button onClick={openCreateModal}>Create a user</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.items.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${u.isActive ? "bg-blue-500" : "bg-gray-400"}`}>
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{u.fullName}</h3>
                      {!u.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || ""}`}>
                      {formatLabel(u.role)}
                    </span>
                    {u.department && (
                      <span className="text-xs text-gray-400">{u.department}</span>
                    )}
                    {u.manager && (
                      <span className="text-xs text-gray-400">Manager: {u.manager.fullName}</span>
                    )}
                    {u.startDate && (
                      <span className="text-xs text-gray-400">Started: {formatDate(u.startDate)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                      Edit
                    </Button>
                    {u.role === "recruit" && (
                      <Button variant="ghost" size="sm" onClick={() => openAssignManager(u)}>
                        Assign
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setToggleTarget(u)}>
                      <span className={u.isActive ? "text-orange-600" : "text-green-600"}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={users.page}
            totalPages={users.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User" : "New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {formError}
            </div>
          )}
          {!editingUser && (
            <>
              <Input
                label="Email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, number, special"
                required
              />
            </>
          )}
          <Input
            label="Full Name"
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
            placeholder="John Doe"
            required
            maxLength={150}
          />
          <Select
            label="Role"
            options={roleFormOptions}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value as Role)}
          />
          <Input
            label="Department"
            value={formDepartment}
            onChange={(e) => setFormDepartment(e.target.value)}
            placeholder="Engineering, HR, etc."
            maxLength={100}
          />
          <Input
            label="Start Date"
            type="date"
            value={formStartDate}
            onChange={(e) => setFormStartDate(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirmation */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? "Deactivate User" : "Activate User"}
        message={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.fullName}"? They will no longer be able to log in.`
            : `Are you sure you want to activate "${toggleTarget?.fullName}"?`
        }
        loading={toggleLoading}
      />

      {/* Assign Manager Modal */}
      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign Manager"
      >
        <form onSubmit={handleAssignManager} className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign a manager to <span className="font-medium">{assignTarget?.fullName}</span>
          </p>
          <Select
            label="Manager"
            options={[
              { value: "", label: "No Manager" },
              ...managers.map((m) => ({
                value: m.id,
                label: `${m.fullName} (${m.email})`,
              })),
            ]}
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={assignLoading}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
