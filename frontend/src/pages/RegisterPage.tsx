import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, Space, DatePicker } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, BankOutlined } from "@ant-design/icons";
import { useAuth } from "../context/useAuth";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    email: string;
    password: string;
    confirm_password: string;
    full_name: string;
    department?: string;
    start_date?: { format: (fmt: string) => string };
  }) => {
    setError(null);
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        department: values.department || undefined,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : undefined,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      const detail = axiosErr.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else {
        setError("Registration failed. Please try again.");
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
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 450, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ marginBottom: 4 }}>
              Create Account
            </Title>
            <Text type="secondary">Join the Onboarding Diary</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          )}

          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
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
              <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter a password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
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
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
            </Form.Item>

            <Form.Item name="department" label="Department">
              <Input prefix={<BankOutlined />} placeholder="e.g., Engineering" size="large" />
            </Form.Item>

            <Form.Item name="start_date" label="Start Date">
              <DatePicker style={{ width: "100%" }} size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text>
              Already have an account?{" "}
              <Link to="/login">Sign In</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
