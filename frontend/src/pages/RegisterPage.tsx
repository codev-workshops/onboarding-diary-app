import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, DatePicker, message, Space } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, BankOutlined } from "@ant-design/icons";
import { useAuth } from "../context/useAuth";
import type { RegisterRequest } from "../types/auth";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;

interface RegisterFormValues {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  department?: string;
  start_date?: Dayjs;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        department: values.department || undefined,
        start_date: values.start_date ? values.start_date.format("YYYY-MM-DD") : undefined,
      };
      await register(payload);
      message.success("Registration successful! Please sign in.");
      navigate("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        message.error(detail);
      } else if (Array.isArray(detail)) {
        message.error(detail.map((d) => d.msg).join(", "));
      } else {
        message.error("Registration failed. Please try again.");
      }
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
        minHeight: "80vh",
      }}
    >
      <Card style={{ width: 480, boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", textAlign: "center", marginBottom: 24 }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Create Account
          </Title>
          <Text type="secondary">Start documenting your onboarding journey</Text>
        </Space>

        <Form name="register" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[
              { required: true, message: "Please enter your full name" },
              { min: 2, message: "Name must be at least 2 characters" },
              { max: 150, message: "Name must be at most 150 characters" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="John Doe" />
          </Form.Item>

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
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern: /[A-Z]/,
                message: "Password must contain at least one uppercase letter",
              },
              {
                pattern: /[a-z]/,
                message: "Password must contain at least one lowercase letter",
              },
              {
                pattern: /\d/,
                message: "Password must contain at least one digit",
              },
              {
                pattern: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/,
                message: "Password must contain at least one special character",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Min 8 chars, upper, lower, digit, special"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Re-enter password" />
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Input prefix={<BankOutlined />} placeholder="e.g. Engineering" />
          </Form.Item>

          <Form.Item name="start_date" label="Start Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text>
            Already have an account? <Link to="/login">Sign in</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
