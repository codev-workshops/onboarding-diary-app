"""Seed the database with sample data for testing and demonstration.

Usage (from project root):
    docker compose exec backend python -m scripts.seed_data

This script creates:
- 3 users (recruit, manager, admin)
- 10 tasks across multiple dates, categories, statuses
- 6 issues with varying severities
- 5 feedback entries (positive, suggestion, concern)
- 5 notes with tags
"""

import asyncio
import uuid
from datetime import date, timedelta

from passlib.context import CryptContext

from app.database import async_session_factory
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TODAY = date.today()


def _hash(password: str) -> str:
    return pwd_context.hash(password)


async def seed() -> None:
    async with async_session_factory() as db:
        # Check if data already exists
        from sqlalchemy import func, select

        user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        if user_count > 0:
            print(f"Database already has {user_count} user(s). Skipping seed.")
            print("To re-seed, drop existing data first:")
            print(
                "  docker compose exec db psql -U postgres -d onboarding_diary -c 'TRUNCATE users CASCADE;'"
            )
            return

        # --- Users ---
        admin_id = uuid.uuid4()
        manager_id = uuid.uuid4()
        recruit_id = uuid.uuid4()

        admin = User(
            id=admin_id,
            email="admin@example.com",
            password_hash=_hash("Admin123!"),
            full_name="Alice Admin",
            role="admin",
            department="Engineering",
            start_date=TODAY - timedelta(days=365),
        )
        manager = User(
            id=manager_id,
            email="manager@example.com",
            password_hash=_hash("Manager123!"),
            full_name="Marcus Manager",
            role="manager",
            department="Engineering",
            start_date=TODAY - timedelta(days=180),
        )
        recruit = User(
            id=recruit_id,
            email="recruit@example.com",
            password_hash=_hash("Recruit123!"),
            full_name="Riley Recruit",
            role="recruit",
            department="Engineering",
            start_date=TODAY - timedelta(days=14),
            manager_id=manager_id,
        )
        db.add_all([admin, manager, recruit])
        await db.flush()

        # --- Tasks (10 entries) ---
        tasks = [
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=13),
                title="Complete HR onboarding forms",
                description="Fill out tax forms, emergency contacts, and benefits enrollment",
                category="onboarding",
                status="completed",
                priority="high",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=12),
                title="Set up development environment",
                description="Install IDE, Docker, Git, and clone all required repositories",
                category="setup",
                status="completed",
                priority="high",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=11),
                title="Read team coding standards",
                description="Review the team wiki for coding conventions, PR guidelines, and branching strategy",
                category="documentation",
                status="completed",
                priority="medium",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=10),
                title="Complete security training",
                description="Finish the mandatory security awareness training modules",
                category="training",
                status="completed",
                priority="high",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=8),
                title="Shadow senior developer",
                description="Pair program with Sarah on the payments microservice",
                category="training",
                status="completed",
                priority="medium",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=6),
                title="Fix first bug (JIRA-1234)",
                description="Resolve the date formatting issue in the user profile page",
                category="development",
                status="completed",
                priority="medium",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=4),
                title="Write unit tests for auth module",
                description="Add test coverage for login, registration, and token refresh flows",
                category="development",
                status="in_progress",
                priority="medium",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=3),
                title="Review architecture documentation",
                description="Study the microservices architecture diagram and API gateway configuration",
                category="documentation",
                status="completed",
                priority="low",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY - timedelta(days=1),
                title="Implement feature flag system",
                description="Add LaunchDarkly integration for the new checkout flow feature",
                category="development",
                status="in_progress",
                priority="high",
            ),
            Task(
                user_id=recruit_id,
                date=TODAY,
                title="Prepare sprint demo presentation",
                description="Create slides showcasing completed work for the sprint review meeting",
                category="meeting",
                status="not_started",
                priority="medium",
            ),
        ]
        db.add_all(tasks)

        # --- Issues (6 entries) ---
        issues = [
            Issue(
                user_id=recruit_id,
                date=TODAY - timedelta(days=12),
                title="VPN connection drops frequently",
                description="The VPN disconnects every 30 minutes, requiring manual reconnection",
                severity="high",
                status="resolved",
                resolution_notes="IT updated the VPN client to v3.2 which fixed the timeout issue",
            ),
            Issue(
                user_id=recruit_id,
                date=TODAY - timedelta(days=10),
                title="Missing access to staging environment",
                description="Cannot access the staging Kubernetes cluster - permission denied errors",
                severity="high",
                status="resolved",
                resolution_notes="DevOps added my account to the staging-developers IAM group",
            ),
            Issue(
                user_id=recruit_id,
                date=TODAY - timedelta(days=7),
                title="Docker build fails on M1 Mac",
                description="The backend Dockerfile uses an amd64-only base image causing build failures on ARM",
                severity="medium",
                status="resolved",
                resolution_notes="Switched to multi-arch base image python:3.11-slim",
            ),
            Issue(
                user_id=recruit_id,
                date=TODAY - timedelta(days=5),
                title="Slow database queries in reports",
                description="Report generation takes over 30 seconds for date ranges longer than 3 months",
                severity="medium",
                status="open",
            ),
            Issue(
                user_id=recruit_id,
                date=TODAY - timedelta(days=2),
                title="Flaky integration test in CI",
                description="The test_payment_webhook test fails intermittently due to race condition",
                severity="low",
                status="open",
            ),
            Issue(
                user_id=recruit_id,
                date=TODAY,
                title="Memory leak in websocket handler",
                description="The notification websocket handler doesn't clean up connections properly, causing memory growth",
                severity="critical",
                status="open",
            ),
        ]
        db.add_all(issues)

        # --- Feedback (5 entries) ---
        feedbacks = [
            Feedback(
                user_id=recruit_id,
                date=TODAY - timedelta(days=13),
                subject="Welcome session was excellent",
                feedback_type="positive",
                details="The team welcome session was very well organized. Everyone was friendly and I felt immediately included.",
            ),
            Feedback(
                user_id=recruit_id,
                date=TODAY - timedelta(days=9),
                subject="Buddy system is very helpful",
                feedback_type="positive",
                details="Having Sarah as my onboarding buddy has been invaluable. She answers questions quickly and explains context well.",
            ),
            Feedback(
                user_id=recruit_id,
                date=TODAY - timedelta(days=6),
                subject="Documentation could be more up-to-date",
                feedback_type="suggestion",
                details="Several wiki pages reference deprecated tools and old API versions. Would be great to have a documentation refresh sprint.",
            ),
            Feedback(
                user_id=recruit_id,
                date=TODAY - timedelta(days=3),
                subject="Too many meetings in first week",
                feedback_type="concern",
                details="The first week had 6 hours of meetings daily, leaving little time for actual setup and learning. Consider spreading meetings over 2 weeks.",
            ),
            Feedback(
                user_id=recruit_id,
                date=TODAY - timedelta(days=1),
                subject="Add a pre-configured dev VM option",
                feedback_type="suggestion",
                details="Setting up the dev environment took 2 full days. A pre-configured VM or devcontainer would save significant time for new hires.",
            ),
        ]
        db.add_all(feedbacks)

        # --- Notes (5 entries) ---
        notes = [
            Note(
                user_id=recruit_id,
                date=TODAY - timedelta(days=13),
                title="Day 1 - First impressions",
                content="Great first day! The office is modern and well-equipped. Met the team during standup. Key contacts: Sarah (buddy), Marcus (manager), DevOps team on Slack #infra-help.",
                tags=["onboarding", "day1", "contacts"],
            ),
            Note(
                user_id=recruit_id,
                date=TODAY - timedelta(days=10),
                title="Architecture overview notes",
                content="The system uses a microservices architecture with an API gateway (Kong). Services communicate via gRPC internally and REST externally. Database per service pattern with PostgreSQL. Event-driven async processing via RabbitMQ.",
                tags=["architecture", "learning", "microservices"],
            ),
            Note(
                user_id=recruit_id,
                date=TODAY - timedelta(days=7),
                title="Team conventions and practices",
                content="PR reviews require 2 approvals. Feature branches from main. Squash merge only. Commit messages follow Conventional Commits. CI must pass before merge. Deploy on Tuesdays and Thursdays only.",
                tags=["conventions", "git", "ci-cd"],
            ),
            Note(
                user_id=recruit_id,
                date=TODAY - timedelta(days=4),
                title="Useful internal tools",
                content="Grafana dashboards at grafana.internal.com. Sentry for error tracking. LaunchDarkly for feature flags. Confluence for docs. Figma for designs. PagerDuty for on-call.",
                tags=["tools", "internal", "reference"],
            ),
            Note(
                user_id=recruit_id,
                date=TODAY - timedelta(days=1),
                title="Sprint retro takeaways",
                content="Team velocity is 42 story points avg. Current focus is checkout flow redesign. Tech debt sprint planned for next month. Need to improve test coverage from 68% to 80%.",
                tags=["sprint", "retro", "metrics"],
            ),
        ]
        db.add_all(notes)

        await db.commit()

    print("Seed data created successfully!")
    print()
    print("Sample accounts:")
    print("  recruit@example.com  / Recruit123!  (recruit role)")
    print("  manager@example.com  / Manager123!  (manager role)")
    print("  admin@example.com    / Admin123!    (admin role)")
    print()
    print(f"Data spans {TODAY - timedelta(days=13)} to {TODAY}")
    print("  10 tasks, 6 issues, 5 feedback entries, 5 notes")


if __name__ == "__main__":
    asyncio.run(seed())
