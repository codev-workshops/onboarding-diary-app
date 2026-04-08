"""Tests for global search endpoint."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_search_returns_matching_results(client: AsyncClient, recruit_user, recruit_token):
    """Test that search returns items matching the query."""
    # Create a task with a searchable title
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Setup onboarding environment",
            "description": "Install all required tools",
            "category": "setup",
        },
    )
    # Create another task that should NOT match
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Fix bug",
            "category": "development",
        },
    )

    resp = await client.get(
        "/api/v1/search/?q=onboarding",
        headers=auth_header(recruit_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Setup onboarding environment"
    assert data["items"][0]["entry_type"] == "task"


@pytest.mark.asyncio
async def test_search_requires_authentication(client: AsyncClient):
    """Test that search returns 403 without a token."""
    resp = await client.get("/api/v1/search/?q=test")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_search_filters_by_entry_type(client: AsyncClient, recruit_user, recruit_token):
    """Test that search respects the entry_type filter."""
    # Create a task and an issue both containing "deploy"
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Deploy staging server",
            "category": "development",
        },
    )
    await client.post(
        "/api/v1/issues/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Deploy pipeline broken",
            "description": "CI deploy step fails",
            "severity": "high",
            "status": "open",
        },
    )

    # Search all types
    resp_all = await client.get(
        "/api/v1/search/?q=deploy&entry_type=all",
        headers=auth_header(recruit_token),
    )
    assert resp_all.status_code == 200
    assert resp_all.json()["total"] == 2

    # Search only tasks
    resp_tasks = await client.get(
        "/api/v1/search/?q=deploy&entry_type=tasks",
        headers=auth_header(recruit_token),
    )
    assert resp_tasks.status_code == 200
    assert resp_tasks.json()["total"] == 1
    assert resp_tasks.json()["items"][0]["entry_type"] == "task"


@pytest.mark.asyncio
async def test_search_escapes_ilike_wildcards(client: AsyncClient, recruit_user, recruit_token):
    """Test that special ILIKE characters (%, _) are escaped and don't match everything."""
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Normal task title",
            "category": "other",
        },
    )

    # Searching for "%" should NOT match "Normal task title"
    resp = await client.get(
        "/api/v1/search/?q=%25",
        headers=auth_header(recruit_token),
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
