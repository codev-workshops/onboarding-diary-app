import { useState, useEffect } from "react";
import type { AxiosError } from "axios";
import type { ApiErrorResponse, RecruitListItem, ReportCategory, ReportFormat } from "../types";
import { useAuth } from "../hooks/useAuth";
import * as reportService from "../services/report.service";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";

const categoryOptions = [
  { value: "combined", label: "Combined (All)" },
  { value: "tasks", label: "Tasks" },
  { value: "issues", label: "Issues" },
  { value: "feedback", label: "Feedback" },
];

const formatOptions = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
];

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReportsPage() {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(todayString());
  const [category, setCategory] = useState<ReportCategory>("combined");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [targetUserId, setTargetUserId] = useState("");
  const [recruits, setRecruits] = useState<RecruitListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isManagerOrAdmin) {
      reportService.getRecruitList().then(setRecruits).catch(() => {});
    }
  }, [isManagerOrAdmin]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const params: Record<string, string> = {
        dateFrom,
        dateTo,
        category,
        format,
      };
      if (targetUserId) {
        params.userId = targetUserId;
      }

      const blob = await reportService.generateReport(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${category}-${dateFrom}-${dateTo}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("Report downloaded successfully!");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      if (axiosErr.response?.data instanceof Blob) {
        const text = await axiosErr.response.data.text();
        try {
          const parsed = JSON.parse(text);
          setError(parsed.error?.message || "Failed to generate report");
        } catch {
          setError("Failed to generate report");
        }
      } else {
        setError(axiosErr.response?.data?.error?.message || "Failed to generate report");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and download onboarding reports</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
            />
            <Input
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
            />
            <Select
              label="Format"
              options={formatOptions}
              value={format}
              onChange={(e) => setFormat(e.target.value as ReportFormat)}
            />
          </div>

          {isManagerOrAdmin && recruits.length > 0 && (
            <Select
              label="Generate For"
              options={[
                { value: "", label: "Myself" },
                ...recruits.map((r) => ({
                  value: r.id,
                  label: `${r.fullName} (${r.email})`,
                })),
              ]}
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            />
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={loading}>
              Generate Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
