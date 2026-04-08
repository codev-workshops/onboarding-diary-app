import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { ConfigProvider, Layout, Typography, Spin } from "antd";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import IssuesPage from "./pages/IssuesPage";
import FeedbackPage from "./pages/FeedbackPage";
import NotesPage from "./pages/NotesPage";
import ReportsPage from "./pages/ReportsPage";
import type { ReactNode } from "react";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 24 }}>
    <Title level={3}>{name}</Title>
    <p>This page is under construction.</p>
  </div>
);

function NavBar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const items = [
    { key: "/dashboard", label: "Dashboard" },
    { key: "/tasks", label: "Tasks" },
    { key: "/issues", label: "Issues" },
    { key: "/feedback", label: "Feedback" },
    { key: "/notes", label: "Notes" },
    { key: "/reports", label: "Reports" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        marginLeft: 32,
        flex: 1,
      }}
    >
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.key}
          style={{
            color:
              location.pathname === item.key
                ? "#1677ff"
                : "rgba(255,255,255,0.65)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
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

function AppRoutes() {
  return (
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Placeholder name="Profile" />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
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
          <Layout style={{ minHeight: "100vh" }}>
            <Header
              style={{
                display: "flex",
                alignItems: "center",
                background: "#001529",
              }}
            >
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                Onboarding Diary
              </Title>
              <NavBar />
            </Header>

            <Content style={{ padding: "24px 48px", flex: 1 }}>
              <AppRoutes />
            </Content>

            <Footer style={{ textAlign: "center" }}>
              Onboarding Diary &copy; {new Date().getFullYear()}
            </Footer>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
