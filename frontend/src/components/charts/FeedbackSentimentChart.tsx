import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SentimentCount } from "../../types";

type Props = {
  data: SentimentCount[];
};

const sentimentColors: Record<string, string> = {
  positive: "#22c55e",
  suggestion: "#3b82f6",
  concern: "#f97316",
};

function formatLabel(val: string): string {
  return val.charAt(0).toUpperCase() + val.slice(1);
}

export default function FeedbackSentimentChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No feedback recorded yet
      </div>
    );
  }

  const formatted = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: formatLabel(d.type),
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="count"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {formatted.map((entry, index) => (
            <Cell key={index} fill={sentimentColors[entry.type] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
