import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ConfigProvider, Layout, Menu, Typography, Button, Tag, Dropdown, Space } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  WarningOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

const { Sider, Content, Footer } = Layout;
const { Title } = Typography;

const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 24 }}>
    <Title level={3}>{name}</Title>
    <p>This page is under construction.</p>
  </div>
);

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems: MenuProps["items"] = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/tasks", icon: <CheckSquareOutlined />, label: "Tasks" },
    { key: "/issues", icon: <WarningOutlined />, label: "Issues" },
    { key: "/feedback", icon: <MessageOutlined />, label: "Feedback" },
    { key: "/notes", icon: <FileTextOutlined />, label: "Notes" },
    { key: "/reports", icon: <BarChartOutlined />, label: "Reports" },
  ];

  if (user?.role === "admin") {
    menuItems.push({
      key: "/admin/users",
      icon: <TeamOutlined />,
      label: "Admin",
    });
  }

  const roleColor =
    user?.role === "admin" ? "red" : user?.role === "manager" ? "blue" : "green";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth={0}>
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 16,
          }}
        >
          <Title level={4} style={{ color: "#fff", margin: 0, whiteSpace: "nowrap" }}>
            Onboarding Diary
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Layout.Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <Tag color={roleColor}>{user?.role?.toUpperCase()}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />}>
                {user?.full_name}
              </Button>
            </Dropdown>
          </Space>
        </Layout.Header>
        <Content style={{ margin: 24, padding: 24, background: "#fff", borderRadius: 8 }}>
          <Routes>
            <Route path="/dashboard" element={<Placeholder name="Dashboard" />} />
            <Route path="/tasks" element={<Placeholder name="Tasks" />} />
            <Route path="/issues" element={<Placeholder name="Issues" />} />
            <Route path="/feedback" element={<Placeholder name="Feedback" />} />
            <Route path="/notes" element={<Placeholder name="Notes" />} />
            <Route path="/reports" element={<Placeholder name="Reports" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Placeholder name="Admin - User Management" />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Onboarding Diary &copy; {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
