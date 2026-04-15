import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Typography,
  Alert,
  Divider,
  Tag,
  Space,
  message,
} from "antd";
import { UserOutlined, BankOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "../context/useAuth";
import { userApi, authApi } from "../api/auth";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        full_name: user.full_name,
        department: user.department,
        start_date: user.start_date ? dayjs(user.start_date) : null,
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (values: {
    full_name: string;
    department?: string;
    start_date?: dayjs.Dayjs;
  }) => {
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      await userApi.updateProfile({
        full_name: values.full_name,
        department: values.department || undefined,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : undefined,
      });
      await refreshUser();
      setProfileSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setProfileError(axiosErr.response?.data?.detail || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (values: {
    current_password: string;
    new_password: string;
  }) => {
    setPasswordError(null);
    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setPasswordError(axiosErr.response?.data?.detail || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  const roleColor =
    user.role === "admin" ? "red" : user.role === "manager" ? "blue" : "green";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Title level={3}>My Profile</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ marginBottom: 16 }}>
          <Text strong>Email: </Text>
          <Text>{user.email}</Text>
        </Space>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Role: </Text>
          <Tag color={roleColor}>{user.role.toUpperCase()}</Tag>
        </div>

        {profileError && (
          <Alert
            message={profileError}
            type="error"
            showIcon
            closable
            onClose={() => setProfileError(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        {profileSuccess && (
          <Alert
            message="Profile updated successfully"
            type="success"
            showIcon
            closable
            onClose={() => setProfileSuccess(false)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={profileForm} layout="vertical" onFinish={onProfileSubmit}>
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[
              { required: true, message: "Please enter your full name" },
              { min: 2, message: "Name must be at least 2 characters" },
              { max: 150, message: "Name must not exceed 150 characters" },
              {
                pattern: /^[a-zA-Z\s]+$/,
                message: "Name must contain only letters and spaces",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Input prefix={<BankOutlined />} size="large" />
          </Form.Item>

          <Form.Item name="start_date" label="Start Date">
            <DatePicker style={{ width: "100%" }} size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={profileLoading}>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Title level={4}>Change Password</Title>
        <Divider style={{ margin: "12px 0" }} />

        {passwordError && (
          <Alert
            message={passwordError}
            type="error"
            showIcon
            closable
            onClose={() => setPasswordError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={passwordForm} layout="vertical" onFinish={onPasswordSubmit}>
          <Form.Item
            name="current_password"
            label="Current Password"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
            hasFeedback
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item
            name="confirm_new_password"
            label="Confirm New Password"
            dependencies={["new_password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
