import { Empty, Button } from "antd";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title = "No data yet",
  description = "Get started by creating your first entry.",
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{title}</div>
            <div style={{ color: "#8c8c8c" }}>{description}</div>
          </div>
        }
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
