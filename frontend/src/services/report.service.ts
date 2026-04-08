import api from "./api";
import type { RecruitListItem } from "../types";

interface GenerateReportParams {
  dateFrom: string;
  dateTo: string;
  category: string;
  format: string;
  userId?: string;
}

export async function generateReport(params: GenerateReportParams): Promise<Blob> {
  const { data } = await api.get("/reports/generate", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}

export async function getRecruitList(): Promise<RecruitListItem[]> {
  const { data } = await api.get<RecruitListItem[]>("/manager/recruits");
  return data;
}
