"""Integration tests for CRUD API endpoints (tasks, issues, feedback, notes)."""

from datetime import date

import pytest

from tests.conftest import auth_header


pytestmark = pytest.mark.asyncio


class TestTasksCRUD:
    async def test_create_task(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Set up dev environment",
                "category": "setup",
                "status": "not_started",
                "priority": "medium",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Set up dev environment"
        assert data["category"] == "setup"

    async def test_list_tasks(self, client, recruit_user):
        _, token = recruit_user
        # Create a task first
        await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "List test task",
                "category": "training",
            },
            headers=auth_header(token),
        )
        response = await client.get(
            "/api/v1/tasks",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1

    async def test_get_task(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Get test task",
                "category": "meeting",
            },
            headers=auth_header(token),
        )
        task_id = create_resp.json()["id"]

        response = await client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Get test task"

    async def test_update_task(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Update test task",
                "category": "setup",
            },
            headers=auth_header(token),
        )
        task_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={"status": "completed"},
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

    async def test_delete_task(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Delete test task",
                "category": "other",
            },
            headers=auth_header(token),
        )
        task_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/tasks/{task_id}",
            headers=auth_header(token),
        )
        assert response.status_code == 204

        # Verify deletion
        get_resp = await client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_header(token),
        )
        assert get_resp.status_code == 404

    async def test_task_not_found(self, client, recruit_user):
        _, token = recruit_user
        response = await client.get(
            "/api/v1/tasks/00000000-0000-0000-0000-000000000001",
            headers=auth_header(token),
        )
        assert response.status_code == 404

    async def test_task_ownership(self, client, recruit_user, admin_user):
        """A recruit cannot access another user's task (except admins)."""
        _, recruit_token = recruit_user
        admin, admin_token = admin_user

        # Create task as admin
        create_resp = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Admin task",
                "category": "other",
            },
            headers=auth_header(admin_token),
        )
        task_id = create_resp.json()["id"]

        # Recruit should be denied
        response = await client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_header(recruit_token),
        )
        assert response.status_code == 403

    async def test_create_task_unauthenticated(self, client):
        response = await client.post(
            "/api/v1/tasks",
            json={
                "date": str(date.today()),
                "title": "Should fail",
                "category": "setup",
            },
        )
        assert response.status_code == 403

    async def test_filter_tasks_by_category(self, client, recruit_user):
        _, token = recruit_user
        await client.post(
            "/api/v1/tasks",
            json={"date": str(date.today()), "title": "Training task", "category": "training"},
            headers=auth_header(token),
        )
        await client.post(
            "/api/v1/tasks",
            json={"date": str(date.today()), "title": "Setup task", "category": "setup"},
            headers=auth_header(token),
        )
        response = await client.get(
            "/api/v1/tasks?category=training",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert all(item["category"] == "training" for item in data["items"])


class TestIssuesCRUD:
    async def test_create_issue(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/issues",
            json={
                "date": str(date.today()),
                "title": "Login page broken",
                "description": "The login page throws a 500 error when submitting",
                "severity": "high",
                "status": "open",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Login page broken"
        assert data["severity"] == "high"

    async def test_list_issues(self, client, recruit_user):
        _, token = recruit_user
        await client.post(
            "/api/v1/issues",
            json={
                "date": str(date.today()),
                "title": "Test issue for list",
                "description": "Description for listing test issues",
                "severity": "low",
            },
            headers=auth_header(token),
        )
        response = await client.get(
            "/api/v1/issues",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert len(response.json()["items"]) >= 1

    async def test_update_issue(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/issues",
            json={
                "date": str(date.today()),
                "title": "Issue to update",
                "description": "This issue needs to be updated later",
                "severity": "medium",
            },
            headers=auth_header(token),
        )
        issue_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/issues/{issue_id}",
            json={"severity": "critical"},
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["severity"] == "critical"

    async def test_delete_issue(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/issues",
            json={
                "date": str(date.today()),
                "title": "Issue to delete",
                "description": "This issue will be deleted in tests",
                "severity": "low",
            },
            headers=auth_header(token),
        )
        issue_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/issues/{issue_id}",
            headers=auth_header(token),
        )
        assert response.status_code == 204


class TestFeedbackCRUD:
    async def test_create_feedback(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/feedback",
            json={
                "date": str(date.today()),
                "subject": "Great onboarding experience",
                "type": "positive",
                "details": "The onboarding process was very smooth and well-organized",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "positive"

    async def test_list_feedback(self, client, recruit_user):
        _, token = recruit_user
        await client.post(
            "/api/v1/feedback",
            json={
                "date": str(date.today()),
                "subject": "Feedback for listing",
                "type": "suggestion",
                "details": "A suggestion for improving the listing endpoint",
            },
            headers=auth_header(token),
        )
        response = await client.get(
            "/api/v1/feedback",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert len(response.json()["items"]) >= 1

    async def test_update_feedback(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/feedback",
            json={
                "date": str(date.today()),
                "subject": "Feedback to update",
                "type": "concern",
                "details": "This feedback will be updated during testing",
            },
            headers=auth_header(token),
        )
        fb_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/feedback/{fb_id}",
            json={"type": "positive"},
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["type"] == "positive"

    async def test_delete_feedback(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/feedback",
            json={
                "date": str(date.today()),
                "subject": "Feedback to delete",
                "type": "positive",
                "details": "This feedback will be deleted in the test",
            },
            headers=auth_header(token),
        )
        fb_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/feedback/{fb_id}",
            headers=auth_header(token),
        )
        assert response.status_code == 204


class TestNotesCRUD:
    async def test_create_note(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/notes",
            json={
                "date": str(date.today()),
                "title": "Meeting notes from standup",
                "content": "Discussed project roadmap and timeline",
                "tags": ["meeting", "roadmap"],
            },
            headers=auth_header(token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Meeting notes from standup"
        assert data["tags"] == ["meeting", "roadmap"]

    async def test_list_notes(self, client, recruit_user):
        _, token = recruit_user
        await client.post(
            "/api/v1/notes",
            json={
                "date": str(date.today()),
                "title": "Note for listing",
                "content": "Content for the listing test note",
                "tags": ["test"],
            },
            headers=auth_header(token),
        )
        response = await client.get(
            "/api/v1/notes",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert len(response.json()["items"]) >= 1

    async def test_update_note(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/notes",
            json={
                "date": str(date.today()),
                "title": "Note to update",
                "content": "Original content for the note",
                "tags": ["original"],
            },
            headers=auth_header(token),
        )
        note_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/notes/{note_id}",
            json={"title": "Updated note title"},
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated note title"

    async def test_delete_note(self, client, recruit_user):
        _, token = recruit_user
        create_resp = await client.post(
            "/api/v1/notes",
            json={
                "date": str(date.today()),
                "title": "Note to delete",
                "content": "This note will be deleted",
            },
            headers=auth_header(token),
        )
        note_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/notes/{note_id}",
            headers=auth_header(token),
        )
        assert response.status_code == 204


class TestAdminUserManagement:
    async def test_list_users_as_admin(self, client, admin_user):
        _, token = admin_user
        response = await client.get(
            "/api/v1/users",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    async def test_list_users_as_recruit_forbidden(self, client, recruit_user):
        _, token = recruit_user
        response = await client.get(
            "/api/v1/users",
            headers=auth_header(token),
        )
        assert response.status_code == 403

    async def test_create_user_as_admin(self, client, admin_user):
        _, token = admin_user
        response = await client.post(
            "/api/v1/users",
            json={
                "email": "created@example.com",
                "password": "StrongP@ss1",
                "full_name": "Created User",
                "role": "recruit",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 201
        assert response.json()["email"] == "created@example.com"

    async def test_update_user_role_as_admin(self, client, admin_user, recruit_user):
        _, admin_token = admin_user
        recruit, _ = recruit_user

        response = await client.put(
            f"/api/v1/users/{recruit.id}",
            json={"role": "manager"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        assert response.json()["role"] == "manager"

    async def test_deactivate_user_as_admin(self, client, admin_user, recruit_user):
        _, admin_token = admin_user
        recruit, _ = recruit_user

        response = await client.put(
            f"/api/v1/users/{recruit.id}",
            json={"is_active": False},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_get_profile(self, client, recruit_user):
        _, token = recruit_user
        response = await client.get(
            "/api/v1/users/me",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["email"] == "recruit@test.com"

    async def test_update_profile(self, client, recruit_user):
        _, token = recruit_user
        response = await client.put(
            "/api/v1/users/me",
            json={"full_name": "Updated Name"},
            headers=auth_header(token),
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"
