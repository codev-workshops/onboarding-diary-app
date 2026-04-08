import apiClient from "./client";
import type {
  DashboardResponse,
  ManagerDashboardResponse,
} from "../types/dashboard";

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>("/dashboard/");
    return response.data;
  },

  getManagerDashboard: async (
    recruitId?: string
  ): Promise<ManagerDashboardResponse> => {
    const params = recruitId ? { recruit_id: recruitId } : {};
    const response = await apiClient.get<ManagerDashboardResponse>(
      "/dashboard/manager",
      { params }
    );
    return response.data;
  },
};
