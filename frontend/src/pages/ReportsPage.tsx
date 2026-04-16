import { useEffect, useState } from "react";
import {
  Card,
  Form,
  DatePicker,
  Select,
  Button,
  Table,
  Typography,
  message,
  Space,
  Tag,
} from "antd";
import { DownloadOutlined, FileAddOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { reportsApi } from "../api/reports";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../context/useAuth";
import type { Report, ManagerRecruit } from "../types";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recruits, setRecruits] = useState<ManagerRecruit[]>([]);

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    loadReports();
    if (isManagerOrAdmin) {
      loadRecruits();
    }
  }, [page]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.list(page, 20);
      setReports(response.data.items);
      setTotal(response.data.total);
    } catch {
      message.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const loadRecruits = async () => {
    try {
      const response = await dashboardApi.getManager();
      setRecruits(response.data.recruits);
    } catch {
      // Silently fail
    }
  };

  const handleGenerate = async (values: {
    date_range: [dayjs.Dayjs, dayjs.Dayjs];
    type: string;
    format: string;
    user_id?: string;
  }) => {
    setGenerating(true);
    try {
      await reportsApi.generate({
        date_from: values.date_range[0].format("YYYY-MM-DD"),
        date_to: values.date_range[1].format("YYYY-MM-DD"),
        type: values.type,
        format: values.format,
        user_id: values.user_id,
      });
      message.success("Report generated successfully");
      form.resetFields();
      setPage(1);
      loadReports();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await reportsApi.download(report.id);
      const blob = new Blob([response.data as BlobPart], {
        type: report.format === "csv" ? "text/csv" : "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${report.date_from}_${report.date_to}_${report.report_type}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      message.error("Failed to download report");
    }
  };

  const reportTypeColors: Record<string, string> = {
    tasks: "blue",
    issues: "orange",
    feedback: "green",
    combined: "purple",
  };

  const columns = [
    {
      title: "Generated At",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => dayjs(val).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Type",
      dataIndex: "report_type",
      key: "report_type",
      render: (t: string) => <Tag color={reportTypeColors[t]}>{t}</Tag>,
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (f: string) => <Tag>{f.toUpperCase()}</Tag>,
    },
    {
      title: "Date Range",
      key: "date_range",
      render: (_: unknown, record: Report) => `${record.date_from} to ${record.date_to}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Report) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Reports</Title>

      {/* Generate Report Form */}
      <Card title="Generate Report" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleGenerate}
          initialValues={{ type: "combined", format: "csv" }}
          style={{ flexWrap: "wrap", gap: 8 }}
        >
          <Form.Item
            name="date_range"
            label="Date Range"
            rules={[{ required: true, message: "Please select a date range" }]}
          >
            <RangePicker />
          </Form.Item>
          <Form.Item
            name="type"
            label="Report Type"
            rules={[{ required: true }]}
          >
            <Select style={{ width: 140 }}>
              <Select.Option value="tasks">Tasks</Select.Option>
              <Select.Option value="issues">Issues</Select.Option>
              <Select.Option value="feedback">Feedback</Select.Option>
              <Select.Option value="combined">Combined</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="format"
            label="Format"
            rules={[{ required: true }]}
          >
            <Select style={{ width: 100 }}>
              <Select.Option value="csv">CSV</Select.Option>
              <Select.Option value="pdf" disabled>
                PDF
              </Select.Option>
            </Select>
          </Form.Item>
          {isManagerOrAdmin && (
            <Form.Item name="user_id" label="Recruit">
              <Select
                placeholder="Self"
                allowClear
                style={{ width: 200 }}
                options={recruits.map((r) => ({
                  label: r.full_name,
                  value: r.id,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<FileAddOutlined />}
                loading={generating}
              >
                Generate
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Report History */}
      <Card title="Report History">
        <Table<Report>
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => setPage(p),
            showTotal: (t) => `Total ${t} reports`,
          }}
        />
      </Card>
    </div>
  );
}
