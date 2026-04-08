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
import { noteApi } from "../api/notes";
import type { Note, NoteCreate, NoteUpdate } from "../types/note";

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form] = Form.useForm();
  const [filterTags, setFilterTags] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterTags) params.tags = filterTags;
      if (filterDates) {
        params.date_from = filterDates[0].format("YYYY-MM-DD");
        params.date_to = filterDates[1].format("YYYY-MM-DD");
      }
      const data = await noteApi.list(params);
      setNotes(data.items);
      setTotal(data.total);
    } catch {
      message.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterTags, filterDates]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = () => {
    setEditingNote(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      tags: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    form.setFieldsValue({
      ...note,
      date: dayjs(note.date),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await noteApi.delete(id);
      message.success("Note deleted");
      fetchNotes();
    } catch {
      message.error("Failed to delete note");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingNote) {
        await noteApi.update(editingNote.id, payload as NoteUpdate);
        message.success("Note updated");
      } else {
        await noteApi.create(payload as NoteCreate);
        message.success("Note created");
      }
      setModalOpen(false);
      fetchNotes();
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
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: 200,
      render: (tags: string[]) =>
        tags.map((tag) => (
          <Tag key={tag} color="blue">
            {tag}
          </Tag>
        )),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Note) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm title="Delete this note?" onConfirm={() => handleDelete(record.id)}>
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
          Notes
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Note
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ marginRight: 8 }} />
          </Col>
          <Col>
            <Input
              placeholder="Filter by tags (comma-separated)"
              allowClear
              style={{ width: 250 }}
              value={filterTags}
              onChange={(e) => setFilterTags(e.target.value || undefined)}
              onPressEnter={() => fetchNotes()}
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
        dataSource={notes}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notes yet. Click 'New Note' to start writing."
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: setPage,
          showTotal: (t) => `Total ${t} notes`,
        }}
      />

      <Modal
        title={editingNote ? "Edit Note" : "New Note"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingNote ? "Update" : "Create"}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
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
            name="content"
            label="Content"
            rules={[
              { required: true, message: "Content is required" },
              { min: 1, message: "Content cannot be empty" },
            ]}
          >
            <TextArea rows={6} maxLength={10000} showCount />
          </Form.Item>
          <Form.Item name="tags" label="Tags" extra="Add tags to categorize your note (max 10)">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Type and press Enter to add tags"
              maxCount={10}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
