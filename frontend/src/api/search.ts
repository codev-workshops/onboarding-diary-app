import apiClient from "./client";
import type { SearchResponse } from "../types/search";

export const searchApi = {
  search: async (
    q: string,
    entryType: string = "all",
    page: number = 1,
    perPage: number = 20,
  ): Promise<SearchResponse> => {
    const response = await apiClient.get<SearchResponse>("/search/", {
      params: { q, entry_type: entryType, page, per_page: perPage },
    });
    return response.data;
  },
};
