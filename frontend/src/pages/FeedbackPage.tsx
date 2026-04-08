import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Empty,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { feedbackApi } from "../api/feedback";
import type { Feedback, FeedbackCreate, FeedbackUpdate } from "../types/feedback";
import { FeedbackType } from "../types/feedback";

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const typeColors: Record<string, string> = {
  positive: "green",
  suggestion: "blue",
  concern: "orange",
};

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterType) params.type = filterType;
      if (filterDates) {
        params.date_from = filterDates[0].format("YYYY-MM-DD");
        params.date_to = filterDates[1].format("YYYY-MM-DD");
      }
      const data = await feedbackApi.list(params);
      setFeedbackList(data.items);
      setTotal(data.total);
    } catch {
      message.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterType, filterDates]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleCreate = () => {
    setEditingFeedback(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      type: FeedbackType.POSITIVE,
    });
    setModalOpen(true);
  };

  const handleEdit = (fb: Feedback) => {
    setEditingFeedback(fb);
    form.setFieldsValue({
      ...fb,
      date: dayjs(fb.date),
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
      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingFeedback) {
        await feedbackApi.update(editingFeedback.id, payload as FeedbackUpdate);
        message.success("Feedback updated");
      } else {
        await feedbackApi.create(payload as FeedbackCreate);
        message.success("Feedback created");
      }
      setModalOpen(false);
      fetchFeedback();
    } catch {
      // form validation errors handled by antd
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (d: string) => dayjs(d).format("MMM D, YYYY"),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (t: string) => <Tag color={typeColors[t]}>{t}</Tag>,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Feedback) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm title="Delete this feedback?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Feedback
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Feedback
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ marginRight: 8 }} />
          </Col>
          <Col>
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 150 }}
              value={filterType}
              onChange={setFilterType}
              options={Object.values(FeedbackType).map((t) => ({
                label: t,
                value: t,
              }))}
            />
          </Col>
          <Col>
            <RangePicker
              value={filterDates}
              onChange={(dates) => setFilterDates(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={feedbackList}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No feedback yet. Click 'New Feedback' to share your thoughts."
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: setPage,
          showTotal: (t) => `Total ${t} feedback entries`,
        }}
      />

      <Modal
        title={editingFeedback ? "Edit Feedback" : "New Feedback"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingFeedback ? "Update" : "Create"}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
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
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={Object.values(FeedbackType).map((t) => ({
                label: t,
                value: t,
              }))}
            />
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
