import apiClient from "./client";
import type {
  ReportGenerateRequest,
  ReportGenerateResponse,
  PaginatedReportResponse,
  RecruitOption,
} from "../types/report";

export const reportsApi = {
  generate: async (
    data: ReportGenerateRequest
  ): Promise<ReportGenerateResponse> => {
    const response = await apiClient.post<ReportGenerateResponse>(
      "/reports/generate",
      data
    );
    return response.data;
  },

  list: async (
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedReportResponse> => {
    const response = await apiClient.get<PaginatedReportResponse>("/reports/", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  download: async (reportId: string): Promise<void> => {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data]);
    const contentDisposition = response.headers["content-disposition"];
    let filename = "report";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        filename = match[1];
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  getRecruits: async (): Promise<RecruitOption[]> => {
    const response = await apiClient.get<RecruitOption[]>("/reports/recruits");
    return response.data;
  },
};
