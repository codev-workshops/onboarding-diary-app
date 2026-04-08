"""Tests for dashboard endpoint."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_dashboard_returns_summary(client: AsyncClient, recruit_user, recruit_token):
    """Test that dashboard returns correct summary counts."""
    # Create a completed task and an open issue
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Completed task",
            "category": "setup",
            "status": "completed",
        },
    )
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Pending task",
            "category": "development",
            "status": "in_progress",
        },
    )
    await client.post(
        "/api/v1/issues/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Open issue",
            "description": "Something is broken",
            "severity": "high",
            "status": "open",
        },
    )

    resp = await client.get("/api/v1/dashboard/", headers=auth_header(recruit_token))
    assert resp.status_code == 200
    data = resp.json()

    assert "summary" in data
    assert "recent_entries" in data
    summary = data["summary"]
    assert summary["total_tasks"] == 2
    assert summary["completed_tasks"] == 1
    assert summary["open_issues"] == 1


@pytest.mark.asyncio
async def test_dashboard_requires_authentication(client: AsyncClient):
    """Test that dashboard returns 403 without a token."""
    resp = await client.get("/api/v1/dashboard/")
    assert resp.status_code == 403
