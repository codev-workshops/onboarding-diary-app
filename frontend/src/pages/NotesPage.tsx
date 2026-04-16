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
import { notesApi } from "../api/notes";
import type { Note, NoteCreateData, NoteUpdateData } from "../types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterTags.length > 0) params.tags = filterTags.join(",");
      if (filterDateRange?.[0]) params.date_from = filterDateRange[0].format("YYYY-MM-DD");
      if (filterDateRange?.[1]) params.date_to = filterDateRange[1].format("YYYY-MM-DD");

      const response = await notesApi.list(params);
      setNotes(response.data.items);
      setTotal(response.data.total);

      // Collect unique tags for filter dropdown
      const tags = new Set<string>();
      response.data.items.forEach((n) => n.tags.forEach((t) => tags.add(t)));
      setAllTags((prev) => {
        const combined = new Set([...prev, ...tags]);
        return Array.from(combined).sort();
      });
    } catch {
      message.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterTags, filterDateRange]);

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
      await notesApi.delete(id);
      message.success("Note deleted");
      fetchNotes();
    } catch {
      message.error("Failed to delete note");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        tags: values.tags || [],
      };

      if (editingNote) {
        await notesApi.update(editingNote.id, payload as NoteUpdateData);
        message.success("Note updated");
      } else {
        await notesApi.create(payload as NoteCreateData);
        message.success("Note created");
      }

      setModalOpen(false);
      fetchNotes();
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
          Notes
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Note
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          onChange={(dates) => {
            setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
            setPage(1);
          }}
          allowClear
        />
        <Select
          mode="multiple"
          placeholder="Filter by tags"
          allowClear
          style={{ minWidth: 200 }}
          options={allTags.map((t) => ({ value: t, label: t }))}
          onChange={(v) => { setFilterTags(v); setPage(1); }}
          value={filterTags}
        />
      </Space>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : notes.length === 0 ? (
        <Empty description="No notes yet" />
      ) : (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
            {notes.map((note) => (
              <Card
                key={note.id}
                title={note.title}
                extra={
                  <Space>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(note)} />
                    <Popconfirm
                      title="Delete this note?"
                      onConfirm={() => handleDelete(note.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
                  {note.content}
                </Paragraph>
                <div style={{ marginTop: 8 }}>
                  {note.tags.map((tag) => (
                    <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
                <Text type="secondary">{dayjs(note.date).format("MMM DD, YYYY")}</Text>
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
        title={editingNote ? "Edit Note" : "New Note"}
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
          <Form.Item
            name="tags"
            label="Tags"
            rules={[
              {
                validator: (_, value: string[]) => {
                  if (value && value.length > 10) {
                    return Promise.reject("Maximum 10 tags allowed");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              placeholder="Add tags (press Enter)"
              tokenSeparators={[","]}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
