import client from "./client";
import type { AnalyticsData } from "../types";

export const analyticsApi = {
  get: (period: string = "monthly") =>
    client.get<AnalyticsData>("/dashboard/analytics", { params: { period } }),
};
