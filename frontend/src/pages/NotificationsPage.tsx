import { useEffect, useState } from "react";
import {
  List,
  Button,
  Typography,
  Tag,
  Space,
  Skeleton,
  Empty,
  Pagination,
  message,
  Popconfirm,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckSquareOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { notificationsApi } from "../api/notifications";
import type { NotificationData } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const typeIcons: Record<string, React.ReactNode> = {
  info: <InfoCircleOutlined style={{ color: "#1677ff" }} />,
  issue: <WarningOutlined style={{ color: "#fa541c" }} />,
  checklist: <CheckSquareOutlined style={{ color: "#52c41a" }} />,
  feedback: <MessageOutlined style={{ color: "#722ed1" }} />,
  task: <CheckSquareOutlined style={{ color: "#1677ff" }} />,
  admin: <BellOutlined style={{ color: "#faad14" }} />,
};

const typeColors: Record<string, string> = {
  info: "blue",
  issue: "red",
  checklist: "green",
  feedback: "purple",
  task: "blue",
  admin: "orange",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.list(page, 20);
      setNotifications(response.data.items);
      setTotal(response.data.total);
      setUnreadCount(response.data.unread_count);
    } catch {
      message.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
    } catch {
      message.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      message.success("All notifications marked as read");
      loadNotifications();
    } catch {
      message.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      loadNotifications();
    } catch {
      message.error("Failed to delete notification");
    }
  };

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
        <Space>
          <Title level={3} style={{ margin: 0 }}>
            Notifications
          </Title>
          {unreadCount > 0 && <Tag color="red">{unreadCount} unread</Tag>}
        </Space>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </Space>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : notifications.length === 0 ? (
        <Empty description="No notifications yet" />
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.is_read ? "transparent" : "#f0f5ff",
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                actions={[
                  !item.is_read && (
                    <Button
                      key="read"
                      size="small"
                      type="text"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      Read
                    </Button>
                  ),
                  <Popconfirm
                    key="delete"
                    title="Delete this notification?"
                    onConfirm={() => handleDelete(item.id)}
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={typeIcons[item.type] || <BellOutlined />}
                  title={
                    <Space>
                      <Text strong={!item.is_read}>{item.title}</Text>
                      <Tag color={typeColors[item.type] || "default"}>{item.type}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text style={{ color: "#595959" }}>{item.message}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.created_at).fromNow()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          {total > 20 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
