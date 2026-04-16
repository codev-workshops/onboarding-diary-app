import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Skeleton,
  Steps,
  Progress,
  Space,
  Tag,
  message,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { analyticsApi } from "../api/analytics";
import type { AnalyticsData } from "../types";

const { Title, Text } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
  low: "#52c41a",
  medium: "#faad14",
  high: "#fa8c16",
  critical: "#f5222d",
};

const FEEDBACK_COLORS: Record<string, string> = {
  positive: "#52c41a",
  suggestion: "#1677ff",
  concern: "#fa541c",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "#d9d9d9",
  in_progress: "#1677ff",
  completed: "#52c41a",
  blocked: "#f5222d",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#52c41a",
  medium: "#faad14",
  high: "#fa8c16",
  critical: "#f5222d",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.get(period);
      setData(response.data);
    } catch {
      message.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !data) {
    return (
      <div>
        <Title level={3}>Analytics & Charts</Title>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  const currentMilestoneIdx = data.onboarding_progress.milestones?.findIndex(
    (m) => !m.reached
  );
  const stepsCurrentIdx =
    currentMilestoneIdx === -1
      ? (data.onboarding_progress.milestones?.length ?? 0)
      : currentMilestoneIdx ?? 0;

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Analytics & Charts
        </Title>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 150 }}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      </Space>

      {/* Tasks Over Time */}
      <Card title="Tasks Over Time" style={{ marginBottom: 24 }}>
        {data.tasks_over_time.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.tasks_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#1677ff"
                name="Created"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#52c41a"
                name="Completed"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text type="secondary">No task data available for the selected period.</Text>
        )}
      </Card>

      <Row gutter={[24, 24]}>
        {/* Issue Severity Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Issue Severity Distribution">
            {data.issue_severity.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.issue_severity}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.issue_severity.map((entry) => (
                      <Cell
                        key={entry.severity}
                        fill={SEVERITY_COLORS[entry.severity] || "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No issues recorded yet.</Text>
            )}
          </Card>
        </Col>

        {/* Feedback Type Breakdown */}
        <Col xs={24} lg={12}>
          <Card title="Feedback Type Breakdown">
            {data.feedback_types.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.feedback_types}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Count">
                    {data.feedback_types.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={FEEDBACK_COLORS[entry.type] || "#8884d8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No feedback recorded yet.</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Task Status Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Task Status Distribution">
            {data.task_status.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.task_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.task_status.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No tasks recorded yet.</Text>
            )}
          </Card>
        </Col>

        {/* Task Priority Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Task Priority Distribution">
            {data.task_priority.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.task_priority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Count">
                    {data.task_priority.map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority] || "#8884d8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No tasks recorded yet.</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Onboarding Progress Timeline */}
      {data.onboarding_progress.milestones &&
        data.onboarding_progress.milestones.length > 0 && (
          <Card title="Onboarding Progress Timeline" style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Day {data.onboarding_progress.current_day} of your onboarding journey
              {data.onboarding_progress.start_date &&
                ` (started ${data.onboarding_progress.start_date})`}
            </Text>
            <Steps
              current={stepsCurrentIdx}
              items={data.onboarding_progress.milestones.map((m) => ({
                title: `Day ${m.day}`,
                description: (
                  <Space direction="vertical" size={4}>
                    <Text style={{ fontSize: 12 }}>{m.date}</Text>
                    <Progress
                      percent={m.completion_rate}
                      size="small"
                      status={m.reached ? "success" : "normal"}
                    />
                    <Text style={{ fontSize: 12 }}>
                      {m.tasks_completed}/{m.tasks_total} tasks
                    </Text>
                    {m.reached ? (
                      <Tag color="green">Reached</Tag>
                    ) : (
                      <Tag color="default">Upcoming</Tag>
                    )}
                  </Space>
                ),
              }))}
            />
          </Card>
        )}
    </div>
  );
}
