import { useState, useCallback, useEffect } from "react";
import {
  Input,
  Select,
  List,
  Tag,
  Typography,
  Spin,
  Empty,
  Pagination,
  Card,
  Space,
  message,
} from "antd";
import {
  SearchOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchApi } from "../api/search";
import type { SearchResultItem } from "../types/search";

const { Title, Text, Paragraph } = Typography;

const ENTRY_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "tasks", label: "Tasks" },
  { value: "issues", label: "Issues" },
  { value: "feedback", label: "Feedback" },
  { value: "notes", label: "Notes" },
];

const TYPE_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string; route: string }
> = {
  task: {
    color: "blue",
    icon: <CheckSquareOutlined />,
    label: "Task",
    route: "/tasks",
  },
  issue: {
    color: "red",
    icon: <ExclamationCircleOutlined />,
    label: "Issue",
    route: "/issues",
  },
  feedback: {
    color: "green",
    icon: <MessageOutlined />,
    label: "Feedback",
    route: "/feedback",
  },
  note: {
    color: "purple",
    icon: <FileTextOutlined />,
    label: "Note",
    route: "/notes",
  },
};

const STATUS_COLORS: Record<string, string> = {
  completed: "green",
  in_progress: "blue",
  not_started: "default",
  open: "orange",
  resolved: "green",
  closed: "default",
  wont_fix: "red",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "magenta",
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ backgroundColor: "#ffe58f", padding: 0 }}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "all";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [entryType, setEntryType] = useState(typeParam);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageParam);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!queryParam);

  const doSearch = useCallback(async (q: string, type: string, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchApi.search(q.trim(), type, p, 20);
      setResults(data.items);
      setTotal(data.total);
    } catch {
      message.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      doSearch(queryParam, typeParam, pageParam);
    }
  }, [queryParam, typeParam, pageParam, doSearch]);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setPage(1);
    setSearchParams({ q, type: entryType, page: "1" });
  };

  const handleTypeChange = (value: string) => {
    setEntryType(value);
    setPage(1);
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim(), type: value, page: "1" });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams({
      q: searchQuery.trim(),
      type: entryType,
      page: String(newPage),
    });
  };

  const renderItemMeta = (item: SearchResultItem) => {
    const config = TYPE_CONFIG[item.entry_type];
    const tags: React.ReactNode[] = [];

    if (item.status) {
      tags.push(
        <Tag key="status" color={STATUS_COLORS[item.status] || "default"}>
          {item.status}
        </Tag>,
      );
    }
    if (item.category) {
      tags.push(
        <Tag key="category" color="cyan">
          {item.category}
        </Tag>,
      );
    }
    if (item.severity) {
      tags.push(
        <Tag key="severity" color={SEVERITY_COLORS[item.severity] || "default"}>
          {item.severity}
        </Tag>,
      );
    }
    if (item.feedback_type) {
      tags.push(
        <Tag key="ftype" color="geekblue">
          {item.feedback_type}
        </Tag>,
      );
    }
    if (item.tags && item.tags.length > 0) {
      item.tags.slice(0, 3).forEach((tag) => {
        tags.push(
          <Tag key={`tag-${tag}`} color="volcano">
            {tag}
          </Tag>,
        );
      });
      if (item.tags.length > 3) {
        tags.push(<Tag key="more-tags">+{item.tags.length - 3} more</Tag>);
      }
    }

    return (
      <List.Item
        key={item.id}
        style={{ cursor: "pointer" }}
        onClick={() => navigate(config.route)}
        extra={
          <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
            {item.date}
          </Text>
        }
      >
        <List.Item.Meta
          avatar={
            <Tag color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          }
          title={highlightMatch(item.title, queryParam)}
          description={
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              {item.snippet && (
                <Paragraph type="secondary" style={{ marginBottom: 4 }} ellipsis={{ rows: 2 }}>
                  {highlightMatch(item.snippet, queryParam)}
                </Paragraph>
              )}
              {tags.length > 0 && <Space wrap>{tags}</Space>}
            </Space>
          }
        />
      </List.Item>
    );
  };

  // Group results by type for summary
  const groupCounts = results.reduce(
    (acc, item) => {
      acc[item.entry_type] = (acc[item.entry_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      <Title level={2}>
        <SearchOutlined /> Search
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Select
              value={entryType}
              onChange={handleTypeChange}
              options={ENTRY_TYPE_OPTIONS}
              style={{ width: 150 }}
            />
            <Input.Search
              placeholder="Search across tasks, issues, feedback, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              enterButton="Search"
              size="middle"
              allowClear
              style={{ flex: 1 }}
            />
          </Space.Compact>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : searched && results.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              No results found for <strong>&quot;{queryParam}&quot;</strong>
            </span>
          }
        />
      ) : searched ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Found <strong>{total}</strong> result{total !== 1 ? "s" : ""} for{" "}
              <strong>&quot;{queryParam}&quot;</strong>
              {entryType !== "all" && (
                <>
                  {" "}
                  in <strong>{entryType}</strong>
                </>
              )}
            </Text>
            {entryType === "all" && Object.keys(groupCounts).length > 0 && (
              <div style={{ marginTop: 8 }}>
                {Object.entries(groupCounts).map(([type, count]) => {
                  const config = TYPE_CONFIG[type];
                  return (
                    <Tag key={type} color={config?.color} style={{ marginBottom: 4 }}>
                      {config?.label}: {count}
                    </Tag>
                  );
                })}
              </div>
            )}
          </div>

          <List
            dataSource={results}
            renderItem={renderItemMeta}
            bordered
            style={{ background: "#fff" }}
          />

          {total > 20 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={handlePageChange}
                showTotal={(t) => `Total ${t} results`}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
