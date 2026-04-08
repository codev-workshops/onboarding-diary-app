import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, message, Space } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../context/useAuth";
import type { LoginRequest } from "../types/auth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await login(values);
      message.success("Login successful!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
      }}
    >
      <Card style={{ width: 420, boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", textAlign: "center", marginBottom: 24 }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Welcome to Onboarding Diary
          </Title>
          <Text type="secondary">Sign in to start your onboarding journey</Text>
        </Space>

        <Form name="login" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text>
            Don't have an account? <Link to="/register">Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
