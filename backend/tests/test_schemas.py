"""Unit tests for Pydantic schema validation."""

import datetime as dt
from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.user import (
    AdminUserCreate,
    AdminUserUpdate,
    ChangePassword,
    UserRegister,
    UserUpdate,
)
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.issue import IssueCreate, IssueUpdate
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate
from app.schemas.note import NoteCreate, NoteUpdate


# --- User schemas ---


class TestUserRegister:
    def _valid_data(self, **overrides):
        defaults = {
            "email": "test@example.com",
            "password": "StrongP@ss1",
            "full_name": "John Doe",
        }
        defaults.update(overrides)
        return defaults

    def test_valid_registration(self):
        user = UserRegister(**self._valid_data())
        assert user.email == "test@example.com"
        assert user.full_name == "John Doe"

    def test_password_too_short(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(password="Ab1!"))

    def test_password_no_uppercase(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(password="lowercase1!"))

    def test_password_no_lowercase(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(password="UPPERCASE1!"))

    def test_password_no_digit(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(password="NoDigits!!"))

    def test_password_no_special_char(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(password="NoSpecial1A"))

    def test_full_name_too_short(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(full_name="A"))

    def test_full_name_with_numbers(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(full_name="John123"))

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            UserRegister(**self._valid_data(email="not-an-email"))

    def test_optional_fields(self):
        user = UserRegister(**self._valid_data(department="Engineering", start_date="2024-01-15"))
        assert user.department == "Engineering"
        assert user.start_date == date(2024, 1, 15)


class TestAdminUserCreate:
    def _valid_data(self, **overrides):
        defaults = {
            "email": "admin@example.com",
            "password": "StrongP@ss1",
            "full_name": "Admin User",
            "role": "recruit",
        }
        defaults.update(overrides)
        return defaults

    def test_valid_admin_create(self):
        user = AdminUserCreate(**self._valid_data())
        assert user.role == "recruit"

    def test_invalid_role(self):
        with pytest.raises(ValidationError):
            AdminUserCreate(**self._valid_data(role="superadmin"))

    def test_valid_roles(self):
        for role in ("recruit", "manager", "admin"):
            user = AdminUserCreate(**self._valid_data(role=role))
            assert user.role == role


class TestAdminUserUpdate:
    def test_valid_role_update(self):
        update = AdminUserUpdate(role="manager")
        assert update.role == "manager"

    def test_invalid_role(self):
        with pytest.raises(ValidationError):
            AdminUserUpdate(role="superuser")

    def test_is_active_update(self):
        update = AdminUserUpdate(is_active=False)
        assert update.is_active is False


class TestUserUpdate:
    def test_valid_update(self):
        update = UserUpdate(full_name="New Name")
        assert update.full_name == "New Name"

    def test_name_with_numbers(self):
        with pytest.raises(ValidationError):
            UserUpdate(full_name="Name123")

    def test_name_null_rejected(self):
        with pytest.raises(ValidationError):
            UserUpdate(full_name=None)


class TestChangePassword:
    def test_valid_change(self):
        cp = ChangePassword(current_password="old", new_password="NewP@ssw0rd")
        assert cp.current_password == "old"

    def test_weak_new_password(self):
        with pytest.raises(ValidationError):
            ChangePassword(current_password="old", new_password="weak")


# --- Task schemas ---


class TestTaskCreate:
    def _valid_data(self, **overrides):
        defaults = {
            "date": str(date.today()),
            "title": "Set up dev environment",
            "category": "setup",
            "status": "not_started",
            "priority": "medium",
        }
        defaults.update(overrides)
        return defaults

    def test_valid_task(self):
        task = TaskCreate(**self._valid_data())
        assert task.category == "setup"
        assert task.status == "not_started"

    def test_invalid_category(self):
        with pytest.raises(ValidationError):
            TaskCreate(**self._valid_data(category="invalid"))

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            TaskCreate(**self._valid_data(status="done"))

    def test_invalid_priority(self):
        with pytest.raises(ValidationError):
            TaskCreate(**self._valid_data(priority="urgent"))

    def test_title_too_short(self):
        with pytest.raises(ValidationError):
            TaskCreate(**self._valid_data(title="AB"))

    def test_date_too_far_future(self):
        future_date = date.today() + timedelta(days=30)
        with pytest.raises(ValidationError):
            TaskCreate(**self._valid_data(date=str(future_date)))

    def test_all_categories_valid(self):
        for cat in ("training", "documentation", "meeting", "setup", "development", "other"):
            task = TaskCreate(**self._valid_data(category=cat))
            assert task.category == cat

    def test_all_statuses_valid(self):
        for status in ("not_started", "in_progress", "completed", "on_hold"):
            task = TaskCreate(**self._valid_data(status=status))
            assert task.status == status

    def test_all_priorities_valid(self):
        for priority in ("low", "medium", "high", "critical"):
            task = TaskCreate(**self._valid_data(priority=priority))
            assert task.priority == priority


class TestTaskUpdate:
    def test_partial_update(self):
        update = TaskUpdate(title="Updated title")
        assert update.title == "Updated title"
        assert update.category is None

    def test_invalid_category_on_update(self):
        with pytest.raises(ValidationError):
            TaskUpdate(category="invalid_cat")


# --- Issue schemas ---


class TestIssueCreate:
    def _valid_data(self, **overrides):
        defaults = {
            "date": str(date.today()),
            "title": "Login page broken",
            "description": "The login page throws a 500 error",
            "severity": "high",
            "status": "open",
        }
        defaults.update(overrides)
        return defaults

    def test_valid_issue(self):
        issue = IssueCreate(**self._valid_data())
        assert issue.severity == "high"

    def test_invalid_severity(self):
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(severity="extreme"))

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(status="fixed"))

    def test_description_too_short(self):
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(description="Short"))

    def test_resolved_requires_resolution_notes(self):
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(status="resolved"))

    def test_resolved_with_notes_valid(self):
        issue = IssueCreate(
            **self._valid_data(status="resolved", resolution_notes="Fixed the login handler")
        )
        assert issue.resolution_notes == "Fixed the login handler"

    def test_closed_requires_resolution_notes(self):
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(status="closed"))

    def test_date_too_far_future(self):
        future_date = date.today() + timedelta(days=30)
        with pytest.raises(ValidationError):
            IssueCreate(**self._valid_data(date=str(future_date)))


class TestIssueUpdate:
    def test_partial_update(self):
        update = IssueUpdate(title="Updated issue title")
        assert update.title == "Updated issue title"

    def test_invalid_severity_on_update(self):
        with pytest.raises(ValidationError):
            IssueUpdate(severity="extreme")


# --- Feedback schemas ---


class TestFeedbackCreate:
    def _valid_data(self, **overrides):
        defaults = {
            "date": str(date.today()),
            "subject": "Great onboarding",
            "type": "positive",
            "details": "The onboarding process was very smooth and helpful",
        }
        defaults.update(overrides)
        return defaults

    def test_valid_feedback(self):
        fb = FeedbackCreate(**self._valid_data())
        assert fb.type == "positive"

    def test_invalid_type(self):
        with pytest.raises(ValidationError):
            FeedbackCreate(**self._valid_data(type="complaint"))

    def test_all_types_valid(self):
        for t in ("positive", "suggestion", "concern"):
            fb = FeedbackCreate(**self._valid_data(type=t))
            assert fb.type == t

    def test_details_too_short(self):
        with pytest.raises(ValidationError):
            FeedbackCreate(**self._valid_data(details="Short"))

    def test_subject_too_short(self):
        with pytest.raises(ValidationError):
            FeedbackCreate(**self._valid_data(subject="AB"))

    def test_date_too_far_future(self):
        future_date = date.today() + timedelta(days=30)
        with pytest.raises(ValidationError):
            FeedbackCreate(**self._valid_data(date=str(future_date)))


class TestFeedbackUpdate:
    def test_partial_update(self):
        update = FeedbackUpdate(subject="Updated subject")
        assert update.subject == "Updated subject"

    def test_invalid_type_on_update(self):
        with pytest.raises(ValidationError):
            FeedbackUpdate(type="complaint")


# --- Note schemas ---


class TestNoteCreate:
    def _valid_data(self, **overrides):
        defaults = {
            "date": str(date.today()),
            "title": "Meeting notes",
            "content": "Discussed project roadmap",
            "tags": ["meeting", "roadmap"],
        }
        defaults.update(overrides)
        return defaults

    def test_valid_note(self):
        note = NoteCreate(**self._valid_data())
        assert note.tags == ["meeting", "roadmap"]

    def test_too_many_tags(self):
        tags = [f"tag{i}" for i in range(11)]
        with pytest.raises(ValidationError):
            NoteCreate(**self._valid_data(tags=tags))

    def test_tag_too_long(self):
        with pytest.raises(ValidationError):
            NoteCreate(**self._valid_data(tags=["a" * 31]))

    def test_tag_with_special_chars(self):
        with pytest.raises(ValidationError):
            NoteCreate(**self._valid_data(tags=["invalid tag!"]))

    def test_valid_tag_with_hyphen(self):
        note = NoteCreate(**self._valid_data(tags=["my-tag"]))
        assert note.tags == ["my-tag"]

    def test_title_too_short(self):
        with pytest.raises(ValidationError):
            NoteCreate(**self._valid_data(title="AB"))

    def test_empty_tags_allowed(self):
        note = NoteCreate(**self._valid_data(tags=[]))
        assert note.tags == []

    def test_date_too_far_future(self):
        future_date = date.today() + timedelta(days=30)
        with pytest.raises(ValidationError):
            NoteCreate(**self._valid_data(date=str(future_date)))


class TestNoteUpdate:
    def test_partial_update(self):
        update = NoteUpdate(title="Updated title")
        assert update.title == "Updated title"

    def test_invalid_tags_on_update(self):
        with pytest.raises(ValidationError):
            NoteUpdate(tags=["invalid tag!"])
