import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="bg-white shadow-md rounded-xl p-6">
        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.fullName}</span>! Your dashboard will be available in a future update.
        </p>
      </div>
    </div>
  );
}
