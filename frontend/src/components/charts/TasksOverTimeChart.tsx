import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TaskOverTimePoint } from "../../types";

type Props = {
  data: TaskOverTimePoint[];
};

export default function TasksOverTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No task data available for the last 30 days
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Tasks" dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
