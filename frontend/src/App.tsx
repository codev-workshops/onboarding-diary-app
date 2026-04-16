import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ConfigProvider, Layout, Menu, Typography, Button, Tag, Dropdown, Space, Drawer, Grid, Badge, Input, Popover, List } from "antd";
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
  SearchOutlined,
  BellOutlined,
  LineChartOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
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
import SearchPage from "./pages/SearchPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChecklistsPage from "./pages/ChecklistsPage";
import NotificationsPage from "./pages/NotificationsPage";
import { notificationsApi } from "./api/notifications";
import type { NotificationData } from "./types";

dayjs.extend(relativeTime);

const { Sider, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpenRaw] = useState(false);
  const searchInputRef = { current: null as HTMLInputElement | null };
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);

  const isMobile = !screens.md;

  // Ctrl+K / Cmd+K keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsApi.list(1, 5);
      setNotifications(response.data.items);
      setUnreadCount(response.data.unread_count);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const fetchAndSchedule = () => {
      loadNotifications();
      return setInterval(loadNotifications, 30000);
    };
    const interval = fetchAndSchedule();
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
    } catch {
      // silently fail
    }
  };

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
    { key: "/analytics", icon: <LineChartOutlined />, label: "Analytics" },
    { key: "/checklists", icon: <OrderedListOutlined />, label: "Checklists" },
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
            {!isMobile && (
              <Input
                ref={(el) => { searchInputRef.current = el?.input ?? null; }}
                placeholder="Search... (Ctrl+K)"
                prefix={<SearchOutlined />}
                style={{ width: 220 }}
                onPressEnter={(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  if (val.trim()) {
                    navigate(`/search?q=${encodeURIComponent(val.trim())}`);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                allowClear
              />
            )}
            <Popover
              open={notifPopoverOpen}
              onOpenChange={setNotifPopoverOpen}
              trigger="click"
              placement="bottomRight"
              title="Notifications"
              content={
                <div style={{ width: 320, maxHeight: 400, overflow: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center", color: "#8c8c8c" }}>
                      No recent notifications
                    </div>
                  ) : (
                    <List
                      size="small"
                      dataSource={notifications}
                      renderItem={(n) => (
                        <List.Item
                          style={{
                            background: n.is_read ? "transparent" : "#f0f5ff",
                            padding: "8px 12px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (!n.is_read) handleMarkAsRead(n.id);
                          }}
                        >
                          <List.Item.Meta
                            title={<span style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</span>}
                            description={
                              <>
                                <div style={{ fontSize: 12, color: "#595959" }}>{n.message}</div>
                                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{dayjs(n.created_at).fromNow()}</div>
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                  <div style={{ textAlign: "center", padding: 8, borderTop: "1px solid #f0f0f0" }}>
                    <Button type="link" size="small" onClick={() => { setNotifPopoverOpen(false); navigate("/notifications"); }}>
                      View All Notifications
                    </Button>
                  </div>
                </div>
              }
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button type="text" icon={<BellOutlined />} style={{ fontSize: 18 }} />
              </Badge>
            </Popover>
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
              <Route path="/search" element={<SearchPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/checklists" element={<ChecklistsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
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
