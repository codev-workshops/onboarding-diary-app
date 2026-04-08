import { PaginatedResponse } from "../types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

export function parsePagination(query: {
  page?: string;
  perPage?: string;
}): { page: number; perPage: number; skip: number } {
  const page = Math.max(1, parseInt(query.page || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(query.perPage || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE)
  );
  const skip = (page - 1) * perPage;
  return { page, perPage, skip };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
