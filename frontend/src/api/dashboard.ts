import apiClient from "./client";
import type { DashboardData, ManagerDashboardData } from "../types";

export const dashboardApi = {
  get: () => apiClient.get<DashboardData>("/dashboard"),

  getManager: (recruitId?: string) =>
    apiClient.get<ManagerDashboardData>("/dashboard/manager", {
      params: recruitId ? { recruit_id: recruitId } : {},
    }),
};
