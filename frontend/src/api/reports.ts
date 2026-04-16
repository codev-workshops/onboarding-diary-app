import apiClient from "./client";
import type { Report, ReportGenerateData, PaginatedResponse } from "../types";

export const reportsApi = {
  generate: (data: ReportGenerateData) =>
    apiClient.post<Report>("/reports/generate", data),

  list: (page = 1, perPage = 20) =>
    apiClient.get<PaginatedResponse<Report>>("/reports", {
      params: { page, per_page: perPage },
    }),

  download: (reportId: string) =>
    apiClient.get(`/reports/${reportId}/download`, { responseType: "blob" }),
};
