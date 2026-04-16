import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  Space,
  List,
  Checkbox,
  Progress,
  Tag,
  Select,
  message,
  Skeleton,
  Popconfirm,
  Empty,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { checklistsApi } from "../api/checklists";
import { useAuth } from "../context/useAuth";
import type { ChecklistData, User } from "../types";

const { Title, Text } = Typography;

export default function ChecklistsPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistData | null>(null);
  const [recruits, setRecruits] = useState<User[]>([]);
  const [selectedRecruit, setSelectedRecruit] = useState<string>("");
  const [form] = Form.useForm();
  const [items, setItems] = useState<{ title: string; description: string }[]>([
    { title: "", description: "" },
  ]);
  const [addItemForm] = Form.useForm();
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    loadChecklists();
    if (isManagerOrAdmin) {
      loadRecruits();
    }
  }, [isManagerOrAdmin]);

  const loadChecklists = async () => {
    setLoading(true);
    try {
      const response = await checklistsApi.list(1, 100);
      setChecklists(response.data.items);
    } catch {
      message.error("Failed to load checklists");
    } finally {
      setLoading(false);
    }
  };

  const loadRecruits = async () => {
    try {
      const response = await checklistsApi.listRecruits();
      setRecruits(response.data.items);
    } catch {
      // silently fail
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const validItems = items
        .filter((item) => item.title.trim())
        .map((item, idx) => ({
          title: item.title.trim(),
          description: item.description.trim() || undefined,
          order: idx,
        }));

      await checklistsApi.create({
        title: values.title,
        description: values.description,
        items: validItems,
      });
      message.success("Checklist created");
      setCreateModalOpen(false);
      form.resetFields();
      setItems([{ title: "", description: "" }]);
      loadChecklists();
    } catch {
      message.error("Failed to create checklist");
    }
  };

  const handleAssign = async () => {
    if (!selectedChecklist || !selectedRecruit) return;
    try {
      await checklistsApi.assign(selectedChecklist.id, selectedRecruit);
      message.success("Checklist assigned");
      setAssignModalOpen(false);
      setSelectedRecruit("");
      loadChecklists();
    } catch {
      message.error("Failed to assign checklist");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await checklistsApi.delete(id);
      message.success("Checklist deleted");
      loadChecklists();
    } catch {
      message.error("Failed to delete checklist");
    }
  };

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await checklistsApi.uncompleteItem(itemId);
      } else {
        await checklistsApi.completeItem(itemId);
      }
      loadChecklists();
    } catch {
      message.error("Failed to update item");
    }
  };

  const handleAddItem = async () => {
    if (!selectedChecklist) return;
    try {
      const values = await addItemForm.validateFields();
      await checklistsApi.addItem(selectedChecklist.id, {
        title: values.title,
        description: values.description,
        order: selectedChecklist.items.length,
      });
      message.success("Item added");
      setAddItemModalOpen(false);
      addItemForm.resetFields();
      loadChecklists();
    } catch {
      message.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      await checklistsApi.deleteItem(checklistId, itemId);
      message.success("Item removed");
      loadChecklists();
    } catch {
      message.error("Failed to remove item");
    }
  };

  const handleUnassign = async (checklistId: string, userId: string) => {
    try {
      await checklistsApi.unassign(checklistId, userId);
      message.success("User unassigned");
      loadChecklists();
    } catch {
      message.error("Failed to unassign");
    }
  };

  if (loading) {
    return (
      <div>
        <Title level={3}>Onboarding Checklists</Title>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Onboarding Checklists
        </Title>
        {isManagerOrAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            New Checklist
          </Button>
        )}
      </Space>

      {checklists.length === 0 ? (
        <Empty
          description={
            isManagerOrAdmin
              ? "No checklists created yet. Create one to get started."
              : "No checklists assigned to you yet."
          }
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {checklists.map((checklist) => (
            <Card
              key={checklist.id}
              title={
                <Space>
                  <span>{checklist.title}</span>
                  <Tag color="blue">{checklist.items.length} items</Tag>
                </Space>
              }
              extra={
                isManagerOrAdmin ? (
                  <Space>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedChecklist(checklist);
                        setAddItemModalOpen(true);
                      }}
                    >
                      Add Item
                    </Button>
                    <Button
                      size="small"
                      icon={<UserAddOutlined />}
                      onClick={() => {
                        setSelectedChecklist(checklist);
                        setAssignModalOpen(true);
                      }}
                    >
                      Assign
                    </Button>
                    <Popconfirm
                      title="Delete this checklist?"
                      onConfirm={() => handleDelete(checklist.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ) : null
              }
            >
              {checklist.description && (
                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  {checklist.description}
                </Text>
              )}

              <Progress
                percent={checklist.progress}
                style={{ marginBottom: 16 }}
                status={checklist.progress === 100 ? "success" : "active"}
              />

              <List
                size="small"
                dataSource={checklist.items}
                renderItem={(item) => (
                  <List.Item
                    actions={
                      isManagerOrAdmin
                        ? [
                            <Popconfirm
                              key="del"
                              title="Remove this item?"
                              onConfirm={() =>
                                handleDeleteItem(checklist.id, item.id)
                              }
                            >
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>,
                          ]
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={item.is_completed}
                      onChange={() => handleToggleItem(item.id, item.is_completed)}
                      disabled={isManagerOrAdmin}
                    >
                      <span
                        style={{
                          textDecoration: item.is_completed ? "line-through" : "none",
                          color: item.is_completed ? "#8c8c8c" : undefined,
                        }}
                      >
                        {item.title}
                      </span>
                      {item.description && (
                        <Text
                          type="secondary"
                          style={{ display: "block", fontSize: 12, marginLeft: 24 }}
                        >
                          {item.description}
                        </Text>
                      )}
                    </Checkbox>
                  </List.Item>
                )}
              />

              {isManagerOrAdmin && checklist.assignments.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ fontSize: 12 }}>
                    Assigned to:{" "}
                  </Text>
                  {checklist.assignments.map((a) => (
                    <Tag
                      key={a.id}
                      closable={isManagerOrAdmin}
                      onClose={(e) => {
                        e.preventDefault();
                        handleUnassign(checklist.id, a.user_id);
                      }}
                    >
                      {a.user_name || a.user_id}
                    </Tag>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </Space>
      )}

      {/* Create Modal */}
      <Modal
        title="Create Checklist"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
          setItems([{ title: "", description: "" }]);
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g., Week 1 Onboarding" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
        </Form>
        <Title level={5}>Checklist Items</Title>
        {items.map((item, idx) => (
          <Space key={idx} style={{ display: "flex", marginBottom: 8 }} align="start">
            <Input
              placeholder="Item title"
              value={item.title}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].title = e.target.value;
                setItems(newItems);
              }}
              style={{ width: 250 }}
            />
            <Input
              placeholder="Description (optional)"
              value={item.description}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].description = e.target.value;
                setItems(newItems);
              }}
              style={{ width: 200 }}
            />
            {items.length > 1 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
              />
            )}
          </Space>
        ))}
        <Button
          type="dashed"
          onClick={() => setItems([...items, { title: "", description: "" }])}
          icon={<PlusOutlined />}
          style={{ marginTop: 8 }}
        >
          Add Item
        </Button>
      </Modal>

      {/* Assign Modal */}
      <Modal
        title={`Assign: ${selectedChecklist?.title}`}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedRecruit("");
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Select Recruit">
            <Select
              placeholder="Choose a recruit"
              value={selectedRecruit || undefined}
              onChange={setSelectedRecruit}
              options={recruits.map((r) => ({
                value: r.id,
                label: `${r.full_name} (${r.email})`,
              }))}
              style={{ width: "100%" }}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ??
                false
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        title={`Add Item to: ${selectedChecklist?.title}`}
        open={addItemModalOpen}
        onOk={handleAddItem}
        onCancel={() => {
          setAddItemModalOpen(false);
          addItemForm.resetFields();
        }}
      >
        <Form form={addItemForm} layout="vertical">
          <Form.Item
            name="title"
            label="Item Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g., Complete team introductions" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
