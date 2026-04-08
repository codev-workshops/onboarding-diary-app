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
import { issueApi } from '../api/issues';
import type { Issue, IssueCreate, IssueUpdate } from '../types/issue';
import { IssueSeverity, IssueStatus } from '../types/issue';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const severityColors: Record<string, string> = {
  low: 'green',
  medium: 'gold',
  high: 'orange',
  critical: 'red',
};

const statusColors: Record<string, string> = {
  open: 'error',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
};

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [form] = Form.useForm();
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterDates) {
        params.date_from = filterDates[0].format('YYYY-MM-DD');
        params.date_to = filterDates[1].format('YYYY-MM-DD');
      }
      const data = await issueApi.list(params);
      setIssues(data.items);
      setTotal(data.total);
    } catch {
      message.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filterSeverity, filterStatus, filterDates]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreate = () => {
    setEditingIssue(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      status: IssueStatus.OPEN,
      severity: IssueSeverity.MEDIUM,
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
      await issueApi.delete(id);
      message.success('Issue deleted');
      fetchIssues();
    } catch {
      message.error('Failed to delete issue');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };

      if (editingIssue) {
        await issueApi.update(editingIssue.id, payload as IssueUpdate);
        message.success('Issue updated');
      } else {
        await issueApi.create(payload as IssueCreate);
        message.success('Issue created');
      }
      setModalOpen(false);
      fetchIssues();
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
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: string) => <Tag color={severityColors[s]}>{s}</Tag>,
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
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Issue) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this issue?"
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
        <Title level={2} style={{ margin: 0 }}>Issues</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Issue
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ marginRight: 8 }} />
          </Col>
          <Col>
            <Select
              placeholder="Severity"
              allowClear
              style={{ width: 150 }}
              value={filterSeverity}
              onChange={setFilterSeverity}
              options={Object.values(IssueSeverity).map((s) => ({
                label: s,
                value: s,
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
              options={Object.values(IssueStatus).map((s) => ({
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
        dataSource={issues}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: setPage,
          showTotal: (t) => `Total ${t} issues`,
        }}
      />

      <Modal
        title={editingIssue ? 'Edit Issue' : 'New Issue'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingIssue ? 'Update' : 'Create'}
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
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Description is required' },
              { min: 10, message: 'Description must be at least 10 characters' },
            ]}
          >
            <TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select
                  options={Object.values(IssueSeverity).map((s) => ({
                    label: s,
                    value: s,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select
                  options={Object.values(IssueStatus).map((s) => ({
                    label: s.replace(/_/g, ' '),
                    value: s,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="resolution_notes" label="Resolution Notes">
            <TextArea rows={3} maxLength={5000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
