import apiClient from "./client";
import type { AnalyticsResponse } from "../types/analytics";

export const analyticsApi = {
  getAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await apiClient.get<AnalyticsResponse>("/analytics/", {
      params,
    });
    return response.data;
  },
};
