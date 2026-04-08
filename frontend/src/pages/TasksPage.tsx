import { useState, useEffect, useCallback } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi } from '../api/tasks';
import type { Task, TaskCreate, TaskUpdate } from '../types/task';
import { TaskCategory, TaskStatus, TaskPriority } from '../types/task';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const categoryColors: Record<string, string> = {
  training: 'blue',
  documentation: 'cyan',
  meeting: 'purple',
  setup: 'orange',
  development: 'green',
  other: 'default',
};

const statusColors: Record<string, string> = {
  not_started: 'default',
  in_progress: 'processing',
  completed: 'success',
  on_hold: 'warning',
};

const priorityColors: Record<string, string> = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterDates) {
        params.date_from = filterDates[0].format('YYYY-MM-DD');
        params.date_to = filterDates[1].format('YYYY-MM-DD');
      }
      const data = await taskApi.list(params);
      setTasks(data.items);
      setTotal(data.total);
    } catch {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterCategory, filterStatus, filterDates]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
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
      await taskApi.delete(id);
      message.success('Task deleted');
      fetchTasks();
    } catch {
      message.error('Failed to delete task');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };

      if (editingTask) {
        await taskApi.update(editingTask.id, payload as TaskUpdate);
        message.success('Task updated');
      } else {
        await taskApi.create(payload as TaskCreate);
        message.success('Task created');
      }
      setModalOpen(false);
      fetchTasks();
    } catch {
      // form validation errors handled by antd
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (c: string) => <Tag color={categoryColors[c]}>{c.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => (
        <Tag color={statusColors[s]}>{s.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => <Tag color={priorityColors[p]}>{p}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Task) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this task?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Tasks</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Task
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ marginRight: 8 }} />
          </Col>
          <Col>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: 150 }}
              value={filterCategory}
              onChange={setFilterCategory}
              options={Object.values(TaskCategory).map((c) => ({
                label: c.replace('_', ' '),
                value: c,
              }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={Object.values(TaskStatus).map((s) => ({
                label: s.replace(/_/g, ' '),
                value: s,
              }))}
            />
          </Col>
          <Col>
            <RangePicker
              value={filterDates}
              onChange={(dates) =>
                setFilterDates(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: setPage,
          showTotal: (t) => `Total ${t} tasks`,
        }}
      />

      <Modal
        title={editingTask ? 'Edit Task' : 'New Task'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingTask ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Title is required' },
              { min: 3, message: 'Title must be at least 3 characters' },
              { max: 200, message: 'Title must be at most 200 characters' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} maxLength={5000} showCount />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select
              options={Object.values(TaskCategory).map((c) => ({
                label: c.replace('_', ' '),
                value: c,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select
                  options={Object.values(TaskStatus).map((s) => ({
                    label: s.replace(/_/g, ' '),
                    value: s,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select
                  options={Object.values(TaskPriority).map((p) => ({
                    label: p,
                    value: p,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
