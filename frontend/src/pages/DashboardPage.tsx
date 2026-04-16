import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Col,
  Grid,
  Row,
  Statistic,
  Progress,
  Skeleton,
  Tabs,
  Table,
  Tag,
  Select,
  Typography,
  Button,
  List,
  Checkbox,
  message,
} from "antd";
import {
  CheckSquareOutlined,
  WarningOutlined,
  MessageOutlined,
  FileTextOutlined,
  TrophyOutlined,
  LineChartOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";
import { checklistsApi } from "../api/checklists";
import { useAuth } from "../context/useAuth";
import EmptyState from "../components/EmptyState";
import type {
  DashboardData,
  ManagerDashboardData,
  RecentTask,
  RecentIssue,
  RecentFeedback,
  RecentNote,
  ChecklistData,
} from "../types";

const { Title } = Typography;
const { useBreakpoint } = Grid;

const categoryColors: Record<string, string> = {
  training: "blue",
  documentation: "cyan",
  meeting: "purple",
  setup: "orange",
  development: "green",
  other: "default",
};

const statusColors: Record<string, string> = {
  not_started: "default",
  in_progress: "processing",
  completed: "success",
  on_hold: "warning",
};

const severityColors: Record<string, string> = {
  low: "green",
  medium: "gold",
  high: "orange",
  critical: "red",
};

const issueStatusColors: Record<string, string> = {
  open: "red",
  in_progress: "orange",
  resolved: "green",
  closed: "default",
};

const feedbackTypeColors: Record<string, string> = {
  positive: "green",
  suggestion: "blue",
  concern: "orange",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [managerData, setManagerData] = useState<ManagerDashboardData | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<string | undefined>(undefined);

  const isManager = user?.role === "manager" || user?.role === "admin";
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);

  const loadChecklists = useCallback(async () => {
    try {
      const response = await checklistsApi.list(1, 5);
      setChecklists(response.data.items);
    } catch {
      // silently fail
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.get();
      setData(response.data);
    } catch {
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManagerDashboard = useCallback(async () => {
    try {
      const response = await dashboardApi.getManager(selectedRecruit);
      setManagerData(response.data);
    } catch {
      // Silently fail for manager dashboard - user may not have recruits
    }
  }, [selectedRecruit]);

  useEffect(() => {
    loadDashboard();
    loadChecklists();
  }, [loadDashboard, loadChecklists]);

  useEffect(() => {
    if (isManager) {
      loadManagerDashboard();
    }
  }, [isManager, loadManagerDashboard]);

  const taskColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Tag color={categoryColors[cat]}>{cat}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={statusColors[s]}>{s.replace(/_/g, " ")}</Tag>,
    },
  ];

  const issueColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (s: string) => <Tag color={severityColors[s]}>{s}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={issueStatusColors[s]}>{s.replace(/_/g, " ")}</Tag>,
    },
  ];

  const feedbackColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={feedbackTypeColors[t]}>{t}</Tag>,
    },
  ];

  const noteColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: string[]) =>
        tags.map((tag) => (
          <Tag key={tag} color="blue">
            {tag}
          </Tag>
        )),
    },
  ];

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Col xs={24} sm={12} md={8} lg={4} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
        <Card style={{ marginBottom: 24 }}><Skeleton active paragraph={{ rows: 2 }} /></Card>
        <Card><Skeleton active paragraph={{ rows: 4 }} /></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data"
        description="Start by creating tasks, logging issues, or adding feedback."
      />
    );
  }

  const tabItems = [
    {
      key: "tasks",
      label: "Recent Tasks",
      children: (
        <Table<RecentTask>
          dataSource={data.recent_tasks}
          columns={taskColumns}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={() => ({
            onClick: () => navigate("/tasks"),
            style: { cursor: "pointer" },
          })}
        />
      ),
    },
    {
      key: "issues",
      label: "Recent Issues",
      children: (
        <Table<RecentIssue>
          dataSource={data.recent_issues}
          columns={issueColumns}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={() => ({
            onClick: () => navigate("/issues"),
            style: { cursor: "pointer" },
          })}
        />
      ),
    },
    {
      key: "feedback",
      label: "Recent Feedback",
      children: (
        <Table<RecentFeedback>
          dataSource={data.recent_feedback}
          columns={feedbackColumns}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={() => ({
            onClick: () => navigate("/feedback"),
            style: { cursor: "pointer" },
          })}
        />
      ),
    },
    {
      key: "notes",
      label: "Recent Notes",
      children: (
        <Table<RecentNote>
          dataSource={data.recent_notes}
          columns={noteColumns}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={() => ({
            onClick: () => navigate("/notes"),
            style: { cursor: "pointer" },
          })}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Dashboard</Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Tasks"
              value={data.summary.total_tasks}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={data.summary.completed_tasks}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Open Issues"
              value={data.summary.open_issues}
              prefix={<WarningOutlined />}
              valueStyle={data.summary.open_issues > 0 ? { color: "#cf1322" } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Feedback"
              value={data.summary.total_feedback}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Notes"
              value={data.summary.total_notes}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Task Completion Progress */}
      <Card title="Task Completion Progress" style={{ marginBottom: 24 }}>
        <Progress
          percent={data.task_completion_rate}
          status={data.task_completion_rate === 100 ? "success" : "active"}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          format={(percent) => `${percent}%`}
        />
        <div style={{ marginTop: 8, color: "#666" }}>
          {data.summary.completed_tasks} of {data.summary.total_tasks} tasks completed
        </div>
      </Card>

      {/* Manager Dashboard */}
      {isManager && managerData && (
        <Card
          title="Team Overview"
          style={{ marginBottom: 24 }}
          extra={
            <Select
              placeholder="All recruits"
              allowClear
              style={{ width: isMobile ? 140 : 200 }}
              value={selectedRecruit}
              onChange={(val) => setSelectedRecruit(val)}
              options={managerData.recruits.map((r) => ({
                label: r.full_name,
                value: r.id,
              }))}
            />
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Team Tasks" value={managerData.aggregate_summary.total_tasks} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Completed"
                value={managerData.aggregate_summary.completed_tasks}
                valueStyle={{ color: "#3f8600" }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Open Issues"
                value={managerData.aggregate_summary.open_issues}
                valueStyle={
                  managerData.aggregate_summary.open_issues > 0 ? { color: "#cf1322" } : undefined
                }
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Feedback" value={managerData.aggregate_summary.total_feedback} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="Notes" value={managerData.aggregate_summary.total_notes} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Completion Rate"
                value={managerData.aggregate_summary.task_completion_rate}
                suffix="%"
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Checklist Progress */}
      {checklists.length > 0 && (
        <Card
          title="Onboarding Checklists"
          style={{ marginBottom: 24 }}
          extra={
            <Button type="link" icon={<OrderedListOutlined />} onClick={() => navigate("/checklists")}>
              View All
            </Button>
          }
        >
          <List
            size="small"
            dataSource={checklists.slice(0, 3)}
            renderItem={(cl) => (
              <List.Item>
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{cl.title}</span>
                    <Tag color={cl.progress === 100 ? "green" : "blue"}>
                      {cl.progress}%
                    </Tag>
                  </div>
                  <Progress
                    percent={cl.progress}
                    size="small"
                    status={cl.progress === 100 ? "success" : "active"}
                    showInfo={false}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {cl.items.slice(0, 3).map((item) => (
                      <Checkbox key={item.id} checked={item.is_completed} disabled>
                        <span style={{ fontSize: 12, color: item.is_completed ? "#8c8c8c" : undefined }}>
                          {item.title}
                        </span>
                      </Checkbox>
                    ))}
                    {cl.items.length > 3 && (
                      <span style={{ fontSize: 12, color: "#8c8c8c" }}>+{cl.items.length - 3} more</span>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Quick Links */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Button type="link" icon={<LineChartOutlined />} onClick={() => navigate("/analytics")}>
          View Analytics & Charts
        </Button>
      </Card>

      {/* Recent Entries */}
      <Card title="Recent Entries">
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
