import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import TasksPage from "./pages/TasksPage";
import IssuesPage from "./pages/IssuesPage";
import FeedbackPage from "./pages/FeedbackPage";
import NotesPage from "./pages/NotesPage";
import ReportsPage from "./pages/ReportsPage";
import ManagerPage from "./pages/ManagerPage";
import AdminPage from "./pages/AdminPage";
import ChecklistPage from "./pages/ChecklistPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/checklists" element={<ChecklistPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
