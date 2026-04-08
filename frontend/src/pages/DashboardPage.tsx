import { useNavigate } from "react-router-dom";
import { Card, Typography, Button, Space, Tag } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Card>
        <Space direction="vertical" size="middle">
          <Space>
            <UserOutlined style={{ fontSize: 24 }} />
            <Title level={4} style={{ margin: 0 }}>
              Welcome, {user?.full_name}!
            </Title>
          </Space>
          <Text>
            <strong>Email:</strong> {user?.email}
          </Text>
          <Text>
            <strong>Role:</strong> <Tag color="blue">{user?.role}</Tag>
          </Text>
          {user?.department && (
            <Text>
              <strong>Department:</strong> {user.department}
            </Text>
          )}
          {user?.start_date && (
            <Text>
              <strong>Start Date:</strong> {user.start_date}
            </Text>
          )}
          <Text type="secondary">
            More dashboard features coming soon — tasks, issues, feedback, and
            notes summaries will appear here.
          </Text>
        </Space>
      </Card>
    </div>
  );
}
