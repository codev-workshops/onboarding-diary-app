import { useEffect, useState, useCallback } from "react";
import {
  Input,
  Select,
  List,
  Tag,
  Typography,
  Space,
  Empty,
  Skeleton,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  CheckSquareOutlined,
  WarningOutlined,
  MessageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { searchApi } from "../api/search";
import type { SearchResult } from "../types";

const { Title, Text, Paragraph } = Typography;

const typeIcons: Record<string, React.ReactNode> = {
  task: <CheckSquareOutlined style={{ color: "#1677ff" }} />,
  issue: <WarningOutlined style={{ color: "#fa541c" }} />,
  feedback: <MessageOutlined style={{ color: "#52c41a" }} />,
  note: <FileTextOutlined style={{ color: "#722ed1" }} />,
};

const typeColors: Record<string, string> = {
  task: "blue",
  issue: "red",
  feedback: "green",
  note: "purple",
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    async (q: string, type: string, pg: number) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const response = await searchApi.search(q.trim(), type, pg);
        setResults(response.data.items);
        setTotal(response.data.total);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, initialType, 1);
    }
  }, [initialQuery, initialType, doSearch]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
    setSearchParams({ q: value, type: typeFilter });
    doSearch(value, typeFilter, 1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    if (query.trim()) {
      setSearchParams({ q: query, type: value });
      doSearch(query, value, 1);
    }
  };

  const handlePageChange = (pg: number) => {
    setPage(pg);
    doSearch(query, typeFilter, pg);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#fff1b8", padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div>
      <Title level={3}>Search</Title>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 24 }} size="middle">
        <Space.Compact style={{ width: "100%" }}>
          <Input.Search
            placeholder="Search tasks, issues, feedback, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={handleSearch}
            enterButton
            size="large"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Space.Compact>
        <Select
          value={typeFilter}
          onChange={handleTypeChange}
          style={{ width: 200 }}
          options={[
            { value: "all", label: "All Types" },
            { value: "tasks", label: "Tasks" },
            { value: "issues", label: "Issues" },
            { value: "feedback", label: "Feedback" },
            { value: "notes", label: "Notes" },
          ]}
        />
      </Space>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : results.length > 0 ? (
        <>
          <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
            {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
          </Text>
          <List
            itemLayout="horizontal"
            dataSource={results}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={typeIcons[item.type]}
                  title={
                    <Space>
                      <span>{highlightMatch(item.title, query)}</span>
                      <Tag color={typeColors[item.type]}>{item.type}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.date}
                      </Text>
                    </Space>
                  }
                  description={
                    <Paragraph
                      style={{ marginBottom: 0, color: "#595959" }}
                      ellipsis={{ rows: 2 }}
                    >
                      {highlightMatch(item.snippet, query)}
                    </Paragraph>
                  }
                />
              </List.Item>
            )}
          />
          {total > 20 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      ) : query.trim() ? (
        <Empty description={`No results found for "${query}"`} />
      ) : (
        <Empty description="Enter a search term to find entries across all categories" />
      )}
    </div>
  );
}
