import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Grid,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { issuesApi } from "../api/issues";
import EmptyState from "../components/EmptyState";
import type { Issue, IssueCreateData, IssueUpdateData } from "../types";

const { Title } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "green",
  medium: "gold",
  high: "orange",
  critical: "red",
};

const STATUS_COLORS: Record<string, string> = {
  open: "error",
  in_progress: "processing",
  resolved: "success",
  closed: "default",
};

export default function IssuesPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [filterSeverity, setFilterSeverity] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterDateRange?.[0]) params.date_from = filterDateRange[0].format("YYYY-MM-DD");
      if (filterDateRange?.[1]) params.date_to = filterDateRange[1].format("YYYY-MM-DD");

      const response = await issuesApi.list(params);
      setIssues(response.data.items);
      setTotal(response.data.total);
    } catch {
      message.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterSeverity, filterStatus, filterDateRange]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreate = () => {
    setEditingIssue(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      status: "open",
      severity: "medium",
    });
    setModalOpen(true);
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    form.setFieldsValue({
      ...issue,
      date: dayjs(issue.date),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await issuesApi.delete(id);
      message.success("Issue deleted");
      fetchIssues();
    } catch {
      message.error("Failed to delete issue");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        resolution_notes: values.resolution_notes || undefined,
      };

      if (editingIssue) {
        await issuesApi.update(editingIssue.id, payload as IssueUpdateData);
        message.success("Issue updated");
      } else {
        await issuesApi.create(payload as IssueCreateData);
        message.success("Issue created");
      }

      setModalOpen(false);
      fetchIssues();
    } catch {
      // Validation errors handled by form
    } finally {
      setSubmitting(false);
    }
  };

  const statusValue = Form.useWatch("status", form);
  const requiresResolution = statusValue === "resolved" || statusValue === "closed";

  const columns: ColumnsType<Issue> = [
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
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      render: (severity: string) => (
        <Tag color={SEVERITY_COLORS[severity]}>{severity.toUpperCase()}</Tag>
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
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: unknown, record: Issue) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this issue?"
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

  if (loading && issues.length === 0) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Issue Log
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {isMobile ? "New" : "New Issue"}
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16, width: "100%" }}>
        <DatePicker.RangePicker
          onChange={(dates) => {
            setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
            setPage(1);
          }}
          allowClear
          style={isMobile ? { width: "100%" } : undefined}
        />
        <Select
          placeholder="Severity"
          allowClear
          style={{ width: isMobile ? "100%" : 150 }}
          options={SEVERITIES}
          onChange={(v) => { setFilterSeverity(v); setPage(1); }}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: isMobile ? "100%" : 150 }}
          options={STATUSES}
          onChange={(v) => { setFilterStatus(v); setPage(1); }}
        />
      </Space>

      {!loading && issues.length === 0 ? (
        <EmptyState
          title="No issues found"
          description="Track any problems or blockers you encounter during onboarding."
          actionText="Report Issue"
          onAction={handleCreate}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={issues}
          rowKey="id"
          loading={loading}
          scroll={{ x: isMobile ? 500 : undefined }}
          pagination={{
            current: page,
            pageSize: perPage,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            size: isMobile ? "small" : undefined,
          }}
        />
      )}

      <Modal
        title={editingIssue ? "Edit Issue" : "New Issue"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={isMobile ? "95vw" : 600}
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
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Description is required" },
              { min: 10, message: "Description must be at least 10 characters" },
            ]}
          >
            <TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
          <Form.Item name="severity" label="Severity" rules={[{ required: true, message: "Severity is required" }]}>
            <Select options={SEVERITIES} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}>
            <Select options={STATUSES} />
          </Form.Item>
          <Form.Item
            name="resolution_notes"
            label="Resolution Notes"
            rules={[
              {
                required: requiresResolution,
                message: "Resolution notes are required when status is resolved or closed",
              },
            ]}
          >
            <TextArea rows={3} maxLength={5000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
