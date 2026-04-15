import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { tasksApi } from "../api/tasks";
import type { Task, TaskCreateData, TaskUpdateData } from "../types";

const { Title } = Typography;
const { TextArea } = Input;

const CATEGORIES = [
  { value: "training", label: "Training" },
  { value: "documentation", label: "Documentation" },
  { value: "meeting", label: "Meeting" },
  { value: "setup", label: "Setup" },
  { value: "development", label: "Development" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_COLORS: Record<string, string> = {
  not_started: "default",
  in_progress: "processing",
  completed: "success",
  on_hold: "warning",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "green",
  medium: "blue",
  high: "orange",
  critical: "red",
};

const CATEGORY_COLORS: Record<string, string> = {
  training: "purple",
  documentation: "cyan",
  meeting: "geekblue",
  setup: "volcano",
  development: "magenta",
  other: "default",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterDateRange?.[0]) params.date_from = filterDateRange[0].format("YYYY-MM-DD");
      if (filterDateRange?.[1]) params.date_to = filterDateRange[1].format("YYYY-MM-DD");

      const response = await tasksApi.list(params);
      setTasks(response.data.items);
      setTotal(response.data.total);
    } catch {
      message.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterCategory, filterStatus, filterDateRange]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      status: "not_started",
      priority: "medium",
      category: "other",
    });
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      date: dayjs(task.date),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.delete(id);
      message.success("Task deleted");
      fetchTasks();
    } catch {
      message.error("Failed to delete task");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        description: values.description || undefined,
      };

      if (editingTask) {
        await tasksApi.update(editingTask.id, payload as TaskUpdateData);
        message.success("Task updated");
      } else {
        await tasksApi.create(payload as TaskCreateData);
        message.success("Task created");
      }

      setModalOpen(false);
      fetchTasks();
    } catch {
      // Validation errors are handled by the form
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Task> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (category: string) => (
        <Tag color={CATEGORY_COLORS[category]}>{category.replace("_", " ").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, " ").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => (
        <Tag color={PRIORITY_COLORS[priority]}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: unknown, record: Task) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this task?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Task Log
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Task
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          onChange={(dates) =>
            setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
          }
          allowClear
        />
        <Select
          placeholder="Category"
          allowClear
          style={{ width: 150 }}
          options={CATEGORIES}
          onChange={(v) => setFilterCategory(v)}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 150 }}
          options={STATUSES}
          onChange={(v) => setFilterStatus(v)}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
      />

      <Modal
        title={editingTask ? "Edit Task" : "New Task"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Title is required" },
              { min: 3, message: "Title must be at least 3 characters" },
              { max: 200, message: "Title must be at most 200 characters" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: "Category is required" }]}>
            <Select options={CATEGORIES} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}>
            <Select options={STATUSES} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true, message: "Priority is required" }]}>
            <Select options={PRIORITIES} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
