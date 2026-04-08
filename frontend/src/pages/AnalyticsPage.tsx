import { useEffect, useState, useCallback } from "react";
import { Typography, DatePicker, Button, Spin, Card, Row, Col, Empty, message } from "antd";
import {
  LineChartOutlined,
  ReloadOutlined,
  PieChartOutlined,
  BarChartOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { analyticsApi } from "../api/analytics";
import type { AnalyticsResponse } from "../types/analytics";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const SEVERITY_COLORS: Record<string, string> = {
  low: "#52c41a",
  medium: "#faad14",
  high: "#ff4d4f",
  critical: "#cf1322",
};

const FEEDBACK_COLORS: Record<string, string> = {
  positive: "#52c41a",
  suggestion: "#1677ff",
  concern: "#faad14",
};

const ACTIVITY_GRADIENT_ID = "activityGradient";

function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      const result = await analyticsApi.getAnalytics(startDate, endDate);
      setData(result);
    } catch {
      message.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format("MMM D");
  };

  const hasTaskData = data?.task_completion.data.some((d) => d.count > 0) ?? false;
  const hasIssueData = (data?.issues_by_severity.data.length ?? 0) > 0;
  const hasFeedbackData = (data?.feedback_distribution.data.length ?? 0) > 0;
  const hasActivityData = data?.activity_timeline.data.some((d) => d.count > 0) ?? false;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <LineChartOutlined /> Analytics
        </Title>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAnalytics} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: "center", padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {/* Task Completion Over Time — Line Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <LineChartOutlined style={{ marginRight: 8 }} />
                  Task Completion Over Time
                </span>
              }
              loading={loading}
              styles={{ body: { height: 350, padding: "12px 16px" } }}
            >
              {hasTaskData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data!.task_completion.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(label: string) => dayjs(label).format("MMM D, YYYY")}
                      formatter={(value: number) => [value, "Tasks Completed"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1677ff"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  description="No completed tasks in this date range"
                  style={{ padding: "60px 0" }}
                />
              )}
            </Card>
          </Col>

          {/* Issues by Severity — Pie/Donut Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <PieChartOutlined style={{ marginRight: 8 }} />
                  Issues by Severity
                </span>
              }
              loading={loading}
              styles={{ body: { height: 350, padding: "12px 16px" } }}
            >
              {hasIssueData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data!.issues_by_severity.data}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      label={({ severity, count }: { severity: string; count: number }) =>
                        `${severity}: ${count}`
                      }
                    >
                      {data!.issues_by_severity.data.map((entry) => (
                        <Cell
                          key={entry.severity}
                          fill={SEVERITY_COLORS[entry.severity] || "#8884d8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value,
                        name.charAt(0).toUpperCase() + name.slice(1),
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No issues in this date range" style={{ padding: "60px 0" }} />
              )}
            </Card>
          </Col>

          {/* Feedback Type Distribution — Bar Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <BarChartOutlined style={{ marginRight: 8 }} />
                  Feedback Type Distribution
                </span>
              }
              loading={loading}
              styles={{ body: { height: 350, padding: "12px 16px" } }}
            >
              {hasFeedbackData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data!.feedback_distribution.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="feedback_type"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [value, "Count"]}
                      labelFormatter={(label: string) =>
                        label.charAt(0).toUpperCase() + label.slice(1)
                      }
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data!.feedback_distribution.data.map((entry) => (
                        <Cell
                          key={entry.feedback_type}
                          fill={FEEDBACK_COLORS[entry.feedback_type] || "#8884d8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No feedback in this date range" style={{ padding: "60px 0" }} />
              )}
            </Card>
          </Col>

          {/* Activity Timeline — Area Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Activity Timeline
                </span>
              }
              loading={loading}
              styles={{ body: { height: 350, padding: "12px 16px" } }}
            >
              {hasActivityData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data!.activity_timeline.data}>
                    <defs>
                      <linearGradient id={ACTIVITY_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(label: string) => dayjs(label).format("MMM D, YYYY")}
                      formatter={(value: number) => [value, "Entries"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1677ff"
                      strokeWidth={2}
                      fill={`url(#${ACTIVITY_GRADIENT_ID})`}
                      name="Entries"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No activity in this date range" style={{ padding: "60px 0" }} />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default AnalyticsPage;
