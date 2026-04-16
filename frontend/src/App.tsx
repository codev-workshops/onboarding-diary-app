import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ConfigProvider, Layout, Menu, Typography, Button, Tag, Dropdown, Space, Drawer, Grid } from "antd";
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
  MenuOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import TasksPage from "./pages/TasksPage";
import IssuesPage from "./pages/IssuesPage";
import FeedbackPage from "./pages/FeedbackPage";
import NotesPage from "./pages/NotesPage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/ReportsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

const { Sider, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpenRaw] = useState(false);

  const isMobile = !screens.md;

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerOpenRaw(open);
  }, []);

  const navigateAndClose = useCallback((path: string) => {
    navigate(path);
    setDrawerOpenRaw(false);
  }, [navigate]);

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

  const bottomNavItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Home" },
    { key: "/tasks", icon: <CheckSquareOutlined />, label: "Tasks" },
    { key: "/issues", icon: <WarningOutlined />, label: "Issues" },
    { key: "/feedback", icon: <MessageOutlined />, label: "Feedback" },
    { key: "/notes", icon: <FileTextOutlined />, label: "Notes" },
  ];

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

  const drawerMenuItems: MenuProps["items"] = [
    ...(menuItems ?? []),
    { type: "divider" as const },
    {
      key: "profile-drawer",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "logout-drawer",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider breakpoint="lg" collapsedWidth={80}>
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
      )}

      {isMobile && (
        <Drawer
          title="Onboarding Diary"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          styles={{
            body: { padding: 0, background: "#001529" },
            header: { background: "#001529", color: "#fff", borderBottom: "1px solid #1f3a5c" },
          }}
          width={250}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={drawerMenuItems}
            onClick={({ key }) => {
              if (key === "profile-drawer") {
                navigateAndClose("/profile");
              } else if (key === "logout-drawer") {
                handleLogout();
              } else {
                navigateAndClose(key);
              }
            }}
          />
        </Drawer>
      )}

      <Layout>
        <Layout.Header
          style={{
            background: "#fff",
            padding: isMobile ? "0 12px" : "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ fontSize: 18 }}
            />
          ) : (
            <div />
          )}
          <Space>
            <Tag color={roleColor}>{user?.role?.toUpperCase()}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />}>
                {isMobile ? "" : user?.full_name}
              </Button>
            </Dropdown>
          </Space>
        </Layout.Header>
        <Content
          style={{
            margin: isMobile ? 8 : 24,
            padding: isMobile ? 12 : 24,
            paddingBottom: isMobile ? 72 : 24,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </Content>
        {!isMobile && (
          <Footer style={{ textAlign: "center" }}>
            Onboarding Diary &copy; {new Date().getFullYear()}
          </Footer>
        )}
      </Layout>

      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            height: 56,
            zIndex: 100,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {bottomNavItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                height: "100%",
                cursor: "pointer",
                color: location.pathname === item.key ? "#1677ff" : "#8c8c8c",
                fontSize: 10,
                gap: 2,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
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
