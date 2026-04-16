import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Grid,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Skeleton,
  Switch,
  Typography,
  message,
  Space,
} from "antd";
import { EditOutlined, UserAddOutlined } from "@ant-design/icons";
import { usersApi } from "../api/users";
import EmptyState from "../components/EmptyState";
import type { User, AdminUserUpdateData } from "../types";

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function AdminUsersPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersApi.list({
        page,
        per_page: 20,
        role: roleFilter,
        is_active: activeFilter,
      });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch {
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, activeFilter]);

  const loadManagers = useCallback(async () => {
    try {
      const response = await usersApi.list({ role: "manager", is_active: true, per_page: 100 });
      setManagers(response.data.items);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const handleEdit = (record: User) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      role: record.role,
      is_active: record.is_active,
      manager_id: record.manager_id || undefined,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const values = await editForm.validateFields();
      const updateData: AdminUserUpdateData = {
        role: values.role,
        is_active: values.is_active,
        manager_id: values.manager_id || null,
      };
      await usersApi.update(editingUser.id, updateData);
      message.success("User updated successfully");
      setEditModalOpen(false);
      setEditingUser(null);
      loadUsers();
      loadManagers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      const values = await createForm.validateFields();
      await usersApi.create({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        role: values.role || "recruit",
        department: values.department || undefined,
      });
      message.success("User created successfully");
      setCreateModalOpen(false);
      createForm.resetFields();
      loadUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "red",
    manager: "blue",
    recruit: "green",
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
    },
    ...(isMobile
      ? []
      : [
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
          },
        ]),
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role: string) => (
        <Tag color={roleColors[role]}>{role.toUpperCase()}</Tag>
      ),
    },
    ...(isMobile
      ? []
      : [
          {
            title: "Department",
            dataIndex: "department",
            key: "department",
            render: (val: string | null) => val || "-",
          },
        ]),
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>
      ),
    },
    ...(isMobile
      ? []
      : [
          {
            title: "Manager",
            dataIndex: "manager_id",
            key: "manager_id",
            render: (managerId: string | null) => {
              if (!managerId) return "-";
              const mgr = managers.find((m) => m.id === managerId);
              return mgr ? mgr.full_name : managerId;
            },
          },
        ]),
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: unknown, record: User) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          {isMobile ? "" : "Edit"}
        </Button>
      ),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>User Management</Title>

      <Card
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            {isMobile ? "New" : "Create User"}
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16, width: "100%" }}>
          <Select
            placeholder="Filter by role"
            allowClear
            style={{ width: isMobile ? "100%" : 150 }}
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val);
              setPage(1);
            }}
          >
            <Select.Option value="recruit">Recruit</Select.Option>
            <Select.Option value="manager">Manager</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
          </Select>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: isMobile ? "100%" : 150 }}
            value={activeFilter === undefined ? undefined : activeFilter ? "active" : "inactive"}
            onChange={(val) => {
              setActiveFilter(val === undefined ? undefined : val === "active");
              setPage(1);
            }}
          >
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Space>

        {!loading && users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create user accounts to manage your team."
            actionText="Create User"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <Table<User>
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: isMobile ? 400 : undefined }}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              onChange: (p) => setPage(p),
              showTotal: isMobile ? undefined : (t) => `Total ${t} users`,
              size: isMobile ? "small" : undefined,
            }}
          />
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        title={`Edit User: ${editingUser?.full_name}`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        onOk={handleEditSubmit}
        confirmLoading={editLoading}
        width={isMobile ? "95vw" : 520}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="recruit">Recruit</Select.Option>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="manager_id" label="Assigned Manager">
            <Select placeholder="No manager" allowClear>
              {managers.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title="Create User"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={createLoading}
        width={isMobile ? "95vw" : 520}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: "Full name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="recruit">
            <Select>
              <Select.Option value="recruit">Recruit</Select.Option>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
