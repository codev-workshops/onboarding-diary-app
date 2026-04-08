"""Tests for Task CRUD endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, recruit_user, recruit_token):
    """Test creating a new task."""
    resp = await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Set up dev environment",
            "description": "Install dependencies and configure IDE",
            "category": "setup",
            "status": "not_started",
            "priority": "high",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Set up dev environment"
    assert data["category"] == "setup"
    assert data["status"] == "not_started"
    assert data["priority"] == "high"
    assert data["user_id"] == str(recruit_user.id)


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, recruit_user, recruit_token):
    """Test listing tasks returns paginated results."""
    # Create two tasks
    for i in range(2):
        await client.post(
            "/api/v1/tasks/",
            headers=auth_header(recruit_token),
            json={
                "date": "2026-04-08",
                "title": f"Task {i}",
                "category": "development",
            },
        )

    resp = await client.get("/api/v1/tasks/", headers=auth_header(recruit_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    assert "page" in data
    assert "per_page" in data


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, recruit_user, recruit_token):
    """Test updating an existing task."""
    # Create a task
    create_resp = await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Original title",
            "category": "setup",
        },
    )
    task_id = create_resp.json()["id"]

    # Update it
    resp = await client.put(
        f"/api/v1/tasks/{task_id}",
        headers=auth_header(recruit_token),
        json={"title": "Updated title", "status": "in_progress"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated title"
    assert data["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, recruit_user, recruit_token):
    """Test deleting a task."""
    # Create a task
    create_resp = await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "To be deleted",
            "category": "other",
        },
    )
    task_id = create_resp.json()["id"]

    # Delete it
    resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_header(recruit_token))
    assert resp.status_code == 204

    # Verify it's gone
    get_resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_header(recruit_token))
    assert get_resp.status_code == 404
