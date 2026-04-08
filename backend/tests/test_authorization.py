"""Tests for role-based authorization."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_recruit_cannot_access_manager_dashboard(
    client: AsyncClient, recruit_user, recruit_token
):
    """Test that a recruit cannot access the manager dashboard endpoint."""
    resp = await client.get("/api/v1/dashboard/manager", headers=auth_header(recruit_token))
    assert resp.status_code == 403
    assert "Only managers and admins" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_manager_can_access_manager_dashboard(
    client: AsyncClient, manager_user, manager_token
):
    """Test that a manager can access the manager dashboard endpoint."""
    resp = await client.get("/api/v1/dashboard/manager", headers=auth_header(manager_token))
    assert resp.status_code == 200
    data = resp.json()
    assert "recruits" in data
    assert "aggregate_summary" in data


@pytest.mark.asyncio
async def test_recruit_cannot_delete_other_users_task(
    client: AsyncClient, recruit_user, recruit_token, manager_user, manager_token
):
    """Test that a recruit cannot delete another user's task."""
    # Manager creates a task
    create_resp = await client.post(
        "/api/v1/tasks/",
        headers=auth_header(manager_token),
        json={
            "date": "2026-04-08",
            "title": "Manager's task",
            "category": "meeting",
        },
    )
    task_id = create_resp.json()["id"]

    # Recruit tries to delete it
    resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_header(recruit_token))
    assert resp.status_code == 403
    assert "your own entries" in resp.json()["detail"]
