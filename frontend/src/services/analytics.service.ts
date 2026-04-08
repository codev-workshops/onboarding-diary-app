import api from "./api";
import type { AnalyticsData } from "../types";

export async function getManagerAnalytics(): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>("/analytics/manager");
  return data;
}
