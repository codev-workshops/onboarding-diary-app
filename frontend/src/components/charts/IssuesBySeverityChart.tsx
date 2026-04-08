import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SeverityCount } from "../../types";

type Props = {
  data: SeverityCount[];
};

const severityColors: Record<string, string> = {
  low: "#6b7280",
  medium: "#3b82f6",
  high: "#f97316",
  critical: "#ef4444",
};

function formatLabel(val: string): string {
  return val.charAt(0).toUpperCase() + val.slice(1);
}

export default function IssuesBySeverityChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No issues recorded yet
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: formatLabel(d.severity),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
          {formatted.map((entry, index) => (
            <Cell key={index} fill={severityColors[entry.severity] || "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
