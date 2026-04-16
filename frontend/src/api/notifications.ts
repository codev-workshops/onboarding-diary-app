import client from "./client";
import type { NotificationListResponse, NotificationData } from "../types";

export const notificationsApi = {
  list: (page: number = 1, perPage: number = 20, unreadOnly: boolean = false) =>
    client.get<NotificationListResponse>("/notifications", {
      params: { page, per_page: perPage, unread_only: unreadOnly },
    }),

  markAsRead: (id: string) =>
    client.put<NotificationData>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    client.put("/notifications/read-all"),

  delete: (id: string) =>
    client.delete(`/notifications/${id}`),
};
