import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  DatePicker,
  Select,
  Table,
  Space,
  message,
  Spin,
  Tag,
  Row,
  Col,
} from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../api/reports";
import type {
  ReportRecord,
  PaginatedReportResponse,
  RecruitOption,
} from "../types/report";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const REPORT_TYPE_OPTIONS = [
  { value: "tasks", label: "Tasks" },
  { value: "issues", label: "Issues" },
  { value: "feedback", label: "Feedback" },
  { value: "combined", label: "Combined" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [reportType, setReportType] = useState<string>("combined");
  const [selectedRecruit, setSelectedRecruit] = useState<string | undefined>(
    undefined
  );
  const [recruits, setRecruits] = useState<RecruitOption[]>([]);
  const [reportHistory, setReportHistory] =
    useState<PaginatedReportResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const isManager = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    loadReportHistory(1);
    if (isManager) {
      loadRecruits();
    }
  }, [isManager]);

  const loadRecruits = async () => {
    try {
      const data = await reportsApi.getRecruits();
      setRecruits(data);
    } catch {
      // May fail if no recruits assigned
    }
  };

  const loadReportHistory = async (page: number) => {
    setLoading(true);
    try {
      const data = await reportsApi.list(page, 10);
      setReportHistory(data);
      setHistoryPage(page);
    } catch {
      message.error("Failed to load report history");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (format: "csv" | "pdf") => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning("Please select a date range");
      return;
    }

    setGenerating(true);
    try {
      const result = await reportsApi.generate({
        date_from: dateRange[0].format("YYYY-MM-DD"),
        date_to: dateRange[1].format("YYYY-MM-DD"),
        type: reportType as "tasks" | "issues" | "feedback" | "combined",
        format,
        user_id: selectedRecruit,
      });

      // Download the generated report
      await reportsApi.download(result.report_id);
      message.success(`Report generated and downloaded as ${format.toUpperCase()}`);

      // Refresh report history
      await loadReportHistory(1);
    } catch {
      message.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      await reportsApi.download(reportId);
      message.success("Report downloaded");
    } catch {
      message.error("Failed to download report");
    }
  };

  const historyColumns = [
    {
      title: "Date Range",
      key: "range",
      render: (_: unknown, record: ReportRecord) =>
        `${record.date_from} — ${record.date_to}`,
    },
    {
      title: "Type",
      dataIndex: "report_type",
      key: "report_type",
      render: (type: string) => (
        <Tag color="blue">{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
      ),
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (fmt: string) => (
        <Tag color={fmt === "pdf" ? "red" : "green"}>
          {fmt.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Generated",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => dayjs(val).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: ReportRecord) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Reports
      </Title>

      {/* Report Generation Form */}
      <Card title="Generate Report" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>Date Range</strong>
            </div>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
          </Col>
          <Col xs={24} md={4}>
            <div style={{ marginBottom: 8 }}>
              <strong>Report Type</strong>
            </div>
            <Select
              style={{ width: "100%" }}
              value={reportType}
              onChange={setReportType}
              options={REPORT_TYPE_OPTIONS}
            />
          </Col>
          {isManager && (
            <Col xs={24} md={4}>
              <div style={{ marginBottom: 8 }}>
                <strong>Recruit</strong>
              </div>
              <Select
                style={{ width: "100%" }}
                placeholder="Select recruit"
                allowClear
                value={selectedRecruit}
                onChange={setSelectedRecruit}
                options={recruits.map((r) => ({
                  value: r.id,
                  label: `${r.full_name}${r.department ? ` (${r.department})` : ""}`,
                }))}
              />
            </Col>
          )}
          <Col xs={24} md={isManager ? 8 : 12}>
            <Space>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => handleGenerate("csv")}
                loading={generating}
              >
                Download CSV
              </Button>
              <Button
                type="primary"
                danger
                icon={<FilePdfOutlined />}
                onClick={() => handleGenerate("pdf")}
                loading={generating}
              >
                Download PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Report History */}
      <Card title="Report History">
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={reportHistory?.items ?? []}
            columns={historyColumns}
            rowKey="id"
            pagination={{
              current: historyPage,
              total: reportHistory?.total ?? 0,
              pageSize: 10,
              onChange: (page) => loadReportHistory(page),
              showTotal: (total) => `Total ${total} reports`,
            }}
          />
        )}
      </Card>
    </div>
  );
}
