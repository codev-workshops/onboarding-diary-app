import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
  Button,
  List,
  Tag,
  Spin,
  message,
  Space,
} from "antd";
import {
  LogoutOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../api/dashboard";
import type {
  DashboardResponse,
  ManagerDashboardResponse,
} from "../types/dashboard";

const { Title } = Typography;

const ENTRY_TYPE_CONFIG: Record<
  string,
  { color: string; label: string; path: string }
> = {
  task: { color: "blue", label: "Task", path: "/tasks" },
  issue: { color: "red", label: "Issue", path: "/issues" },
  feedback: { color: "green", label: "Feedback", path: "/feedback" },
  note: { color: "purple", label: "Note", path: "/notes" },
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [managerData, setManagerData] =
    useState<ManagerDashboardResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getDashboard();
        setDashboardData(data);

        if (user?.role === "manager" || user?.role === "admin") {
          try {
            const mgrData = await dashboardApi.getManagerDashboard();
            setManagerData(mgrData);
          } catch {
            // Manager endpoint may fail if no recruits assigned
          }
        }
      } catch {
        message.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const summary = dashboardData?.summary;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Space>
          <Tag color="blue">{user?.role}</Tag>
          <span>{user?.full_name}</span>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </div>

      {/* Summary Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Tasks"
              value={summary?.total_tasks ?? 0}
              prefix={<UnorderedListOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={summary?.completed_tasks ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={summary?.task_completion_rate ?? 0}
              precision={1}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Open Issues"
              value={summary?.open_issues ?? 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Feedback"
              value={summary?.total_feedback ?? 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Notes"
              value={summary?.total_notes ?? 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Entries */}
      <Card title="Recent Entries" style={{ marginBottom: 24 }}>
        {dashboardData?.recent_entries &&
        dashboardData.recent_entries.length > 0 ? (
          <List
            dataSource={dashboardData.recent_entries}
            renderItem={(entry) => {
              const config = ENTRY_TYPE_CONFIG[entry.entry_type] || {
                color: "default",
                label: entry.entry_type,
                path: "/",
              };
              return (
                <List.Item
                  actions={[
                    <Link to={config.path} key="view">
                      View
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={config.color}>{config.label}</Tag>
                        {entry.title}
                      </Space>
                    }
                    description={
                      <Space>
                        <span>{entry.date}</span>
                        {entry.status && <Tag>{entry.status}</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <p>
            No entries yet. Start by creating tasks, issues, feedback, or notes.
          </p>
        )}
      </Card>

      {/* Manager aggregate view */}
      {managerData && managerData.recruits.length > 0 && (
        <Card title="Recruits Overview">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Recruits"
                value={managerData.recruits.length}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Aggregate Tasks"
                value={managerData.aggregate_summary.total_tasks}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Aggregate Completion"
                value={managerData.aggregate_summary.task_completion_rate}
                precision={1}
                suffix="%"
              />
            </Col>
          </Row>
          <List
            dataSource={managerData.recruits}
            renderItem={(recruit) => (
              <List.Item>
                <List.Item.Meta
                  title={recruit.full_name}
                  description={`${recruit.email}${recruit.department ? ` — ${recruit.department}` : ""}`}
                />
                <Space>
                  <Tag color="blue">{recruit.summary.total_tasks} tasks</Tag>
                  <Tag color="red">
                    {recruit.summary.open_issues} open issues
                  </Tag>
                  <Tag color="green">
                    {recruit.summary.task_completion_rate}% done
                  </Tag>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
