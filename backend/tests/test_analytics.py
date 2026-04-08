"""Tests for analytics endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_analytics_returns_all_chart_data(client: AsyncClient, recruit_user, recruit_token):
    """Test that analytics returns all four chart datasets."""
    # Create some seed data
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Test task",
            "category": "setup",
            "status": "completed",
        },
    )
    await client.post(
        "/api/v1/issues/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Test issue",
            "description": "A test issue",
            "severity": "high",
            "status": "open",
        },
    )
    await client.post(
        "/api/v1/feedback/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "subject": "Test feedback",
            "feedback_type": "positive",
            "details": "Great onboarding experience",
        },
    )

    resp = await client.get(
        "/api/v1/analytics/?start_date=2026-04-08&end_date=2026-04-08",
        headers=auth_header(recruit_token),
    )
    assert resp.status_code == 200
    data = resp.json()

    # All four chart sections present
    assert "task_completion" in data
    assert "issues_by_severity" in data
    assert "feedback_distribution" in data
    assert "activity_timeline" in data

    # Task completion has data for the date
    assert len(data["task_completion"]["data"]) == 1
    assert data["task_completion"]["data"][0]["date"] == "2026-04-08"
    assert data["task_completion"]["data"][0]["count"] == 1

    # Issues by severity
    assert len(data["issues_by_severity"]["data"]) == 1
    assert data["issues_by_severity"]["data"][0]["severity"] == "high"

    # Feedback distribution
    assert len(data["feedback_distribution"]["data"]) == 1
    assert data["feedback_distribution"]["data"][0]["feedback_type"] == "positive"

    # Activity timeline (task + issue + feedback = 3 entries)
    assert data["activity_timeline"]["data"][0]["count"] == 3


@pytest.mark.asyncio
async def test_analytics_date_range_validation(client: AsyncClient, recruit_user, recruit_token):
    """Test that start_date > end_date returns 400."""
    resp = await client.get(
        "/api/v1/analytics/?start_date=2026-04-10&end_date=2026-04-01",
        headers=auth_header(recruit_token),
    )
    assert resp.status_code == 400
    assert "start_date must be on or before end_date" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_analytics_fills_date_gaps(client: AsyncClient, recruit_user, recruit_token):
    """Test that date gaps are filled with zero counts."""
    # Create a task only on Apr 8
    await client.post(
        "/api/v1/tasks/",
        headers=auth_header(recruit_token),
        json={
            "date": "2026-04-08",
            "title": "Only task",
            "category": "setup",
            "status": "completed",
        },
    )

    # Request a 3-day range (Apr 6-8)
    resp = await client.get(
        "/api/v1/analytics/?start_date=2026-04-06&end_date=2026-04-08",
        headers=auth_header(recruit_token),
    )
    assert resp.status_code == 200
    data = resp.json()

    # Should have 3 days of data
    tc_data = data["task_completion"]["data"]
    assert len(tc_data) == 3
    assert tc_data[0]["date"] == "2026-04-06"
    assert tc_data[0]["count"] == 0  # gap filled
    assert tc_data[1]["date"] == "2026-04-07"
    assert tc_data[1]["count"] == 0  # gap filled
    assert tc_data[2]["date"] == "2026-04-08"
    assert tc_data[2]["count"] == 1  # actual data


@pytest.mark.asyncio
async def test_analytics_requires_authentication(client: AsyncClient):
    """Test that analytics returns 403 without a token."""
    resp = await client.get("/api/v1/analytics/")
    assert resp.status_code == 403
