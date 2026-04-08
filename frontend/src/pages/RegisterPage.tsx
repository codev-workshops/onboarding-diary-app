import { useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    startDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.fullName.trim().length < 2) newErrors.fullName = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email address";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = "Must include an uppercase letter";
    else if (!/[a-z]/.test(formData.password)) newErrors.password = "Must include a lowercase letter";
    else if (!/[0-9]/.test(formData.password)) newErrors.password = "Must include a number";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setLoading(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        department: formData.department.trim() || undefined,
        startDate: formData.startDate || undefined,
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const apiError = axiosError.response?.data?.error;
      if (apiError?.details) {
        const fieldErrors: Record<string, string> = {};
        apiError.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(apiError?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Diary</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8 space-y-5">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {serverError}
            </div>
          )}

          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="John Doe"
            error={errors.fullName}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Min 8 chars, uppercase, lowercase, number"
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            required
          />

          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => updateField("department", e.target.value)}
            placeholder="e.g., Engineering"
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
