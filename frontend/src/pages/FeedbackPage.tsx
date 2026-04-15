import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { feedbackApi } from "../api/feedback";
import type { Feedback, FeedbackCreateData, FeedbackUpdateData } from "../types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const FEEDBACK_TYPES = [
  { value: "positive", label: "Positive" },
  { value: "suggestion", label: "Suggestion" },
  { value: "concern", label: "Concern" },
];

const TYPE_COLORS: Record<string, string> = {
  positive: "green",
  suggestion: "blue",
  concern: "orange",
};

export default function FeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterType) params.type = filterType;
      if (filterDateRange?.[0]) params.date_from = filterDateRange[0].format("YYYY-MM-DD");
      if (filterDateRange?.[1]) params.date_to = filterDateRange[1].format("YYYY-MM-DD");

      const response = await feedbackApi.list(params);
      setFeedbackItems(response.data.items);
      setTotal(response.data.total);
    } catch {
      message.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterType, filterDateRange]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleCreate = () => {
    setEditingFeedback(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      type: "positive",
    });
    setModalOpen(true);
  };

  const handleEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    form.setFieldsValue({
      ...feedback,
      date: dayjs(feedback.date),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await feedbackApi.delete(id);
      message.success("Feedback deleted");
      fetchFeedback();
    } catch {
      message.error("Failed to delete feedback");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingFeedback) {
        await feedbackApi.update(editingFeedback.id, payload as FeedbackUpdateData);
        message.success("Feedback updated");
      } else {
        await feedbackApi.create(payload as FeedbackCreateData);
        message.success("Feedback submitted");
      }

      setModalOpen(false);
      fetchFeedback();
    } catch {
      // Validation errors handled by form
    } finally {
      setSubmitting(false);
    }
  };

  const hasMore = page * perPage < total;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Feedback
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Feedback
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
          placeholder="Type"
          allowClear
          style={{ width: 150 }}
          options={FEEDBACK_TYPES}
          onChange={(v) => setFilterType(v)}
        />
      </Space>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : feedbackItems.length === 0 ? (
        <Empty description="No feedback yet" />
      ) : (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
            {feedbackItems.map((fb) => (
              <Card
                key={fb.id}
                title={
                  <Space>
                    <Tag color={TYPE_COLORS[fb.type]}>{fb.type.toUpperCase()}</Tag>
                    <span>{fb.subject}</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(fb)} />
                    <Popconfirm
                      title="Delete this feedback?"
                      onConfirm={() => handleDelete(fb.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
                  {fb.details}
                </Paragraph>
                <Text type="secondary">{dayjs(fb.date).format("MMM DD, YYYY")}</Text>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Space>
              <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Text>
                Page {page} of {Math.ceil(total / perPage) || 1}
              </Text>
              <Button disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </Space>
          </div>
        </>
      )}

      <Modal
        title={editingFeedback ? "Edit Feedback" : "New Feedback"}
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
            name="subject"
            label="Subject"
            rules={[
              { required: true, message: "Subject is required" },
              { min: 3, message: "Subject must be at least 3 characters" },
              { max: 200, message: "Subject must be at most 200 characters" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Type is required" }]}>
            <Select options={FEEDBACK_TYPES} />
          </Form.Item>
          <Form.Item
            name="details"
            label="Details"
            rules={[
              { required: true, message: "Details are required" },
              { min: 10, message: "Details must be at least 10 characters" },
            ]}
          >
            <TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
