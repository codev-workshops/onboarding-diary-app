import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ConfigProvider, Layout, Menu, Spin, Typography, theme } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import IssuesPage from "./pages/IssuesPage";
import FeedbackPage from "./pages/FeedbackPage";
import NotesPage from "./pages/NotesPage";
import ReportsPage from "./pages/ReportsPage";
import type { ReactNode } from "react";

const { Content, Sider, Footer } = Layout;
const { Title } = Typography;

function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return null;

  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/tasks", icon: <CheckSquareOutlined />, label: "Tasks" },
    { key: "/issues", icon: <ExclamationCircleOutlined />, label: "Issues" },
    { key: "/feedback", icon: <MessageOutlined />, label: "Feedback" },
    { key: "/notes", icon: <FileTextOutlined />, label: "Notes" },
    { key: "/reports", icon: <BarChartOutlined />, label: "Reports" },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      logout();
      navigate("/login");
    } else {
      navigate(key);
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="md"
      collapsedWidth={80}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Title
          level={4}
          style={{
            color: "#fff",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {collapsed ? "OD" : "Onboarding Diary"}
        </Title>
      </div>

      {!collapsed && user && (
        <div
          style={{
            padding: "12px 16px",
            color: "rgba(255,255,255,0.65)",
            fontSize: 12,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.full_name}
        </div>
      )}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />

      <div style={{ position: "absolute", bottom: 48, width: "100%" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={[{ key: "logout", icon: <LogoutOutlined />, label: "Logout" }]}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </div>
    </Sider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Content
          style={{
            padding: isAuthenticated ? "24px" : 0,
            flex: 1,
            overflow: "auto",
            background: colorBgContainer,
          }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issues"
              element={
                <ProtectedRoute>
                  <IssuesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
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
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
