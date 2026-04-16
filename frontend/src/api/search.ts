import client from "./client";
import type { SearchResponse } from "../types";

export const searchApi = {
  search: (q: string, type: string = "all", page: number = 1, perPage: number = 20) =>
    client.get<SearchResponse>("/search", { params: { q, type, page, per_page: perPage } }),
};
