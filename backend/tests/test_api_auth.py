"""Integration tests for authentication API endpoints."""

import pytest

from tests.conftest import auth_header


pytestmark = pytest.mark.asyncio


class TestRegister:
    async def test_register_success(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "newuser@example.com",
            "password": "StrongP@ss1",
            "full_name": "New User",
            "department": "Engineering",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["role"] == "recruit"
        assert data["is_active"] is True

    async def test_register_duplicate_email(self, client):
        payload = {
            "email": "dup@example.com",
            "password": "StrongP@ss1",
            "full_name": "First User",
        }
        await client.post("/api/v1/auth/register", json=payload)
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409

    async def test_register_weak_password(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@example.com",
            "password": "weak",
            "full_name": "Weak User",
        })
        assert response.status_code == 422

    async def test_register_invalid_email(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "StrongP@ss1",
            "full_name": "Bad Email",
        })
        assert response.status_code == 422


class TestLogin:
    async def test_login_success(self, client):
        # Register first
        await client.post("/api/v1/auth/register", json={
            "email": "login@example.com",
            "password": "StrongP@ss1",
            "full_name": "Login User",
        })
        response = await client.post("/api/v1/auth/login", json={
            "email": "login@example.com",
            "password": "StrongP@ss1",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "login@example.com"

    async def test_login_wrong_password(self, client):
        await client.post("/api/v1/auth/register", json={
            "email": "wrongpw@example.com",
            "password": "StrongP@ss1",
            "full_name": "Wrong PW",
        })
        response = await client.post("/api/v1/auth/login", json={
            "email": "wrongpw@example.com",
            "password": "WrongP@ss1",
        })
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client):
        response = await client.post("/api/v1/auth/login", json={
            "email": "noone@example.com",
            "password": "StrongP@ss1",
        })
        assert response.status_code == 401


class TestLogout:
    async def test_logout(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/auth/logout",
            headers=auth_header(token),
        )
        assert response.status_code == 200


class TestChangePassword:
    async def test_change_password_success(self, client):
        # Register and login
        await client.post("/api/v1/auth/register", json={
            "email": "changepw@example.com",
            "password": "OldP@ssw0rd",
            "full_name": "Change PW",
        })
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "changepw@example.com",
            "password": "OldP@ssw0rd",
        })
        token = login_resp.json()["access_token"]

        response = await client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "OldP@ssw0rd",
                "new_password": "NewP@ssw0rd!",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 200

    async def test_change_password_wrong_current(self, client, recruit_user):
        _, token = recruit_user
        response = await client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "WrongCurrent1!",
                "new_password": "NewP@ssw0rd!",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 400


class TestPasswordReset:
    async def test_password_reset_request(self, client):
        response = await client.post("/api/v1/auth/password-reset", json={
            "email": "anyone@example.com",
        })
        # Always returns 200 to prevent email enumeration
        assert response.status_code == 200

    async def test_password_reset_confirm(self, client):
        response = await client.post("/api/v1/auth/password-reset/confirm", json={
            "token": "fake-token",
            "new_password": "NewP@ssw0rd!",
        })
        assert response.status_code == 200


class TestProtectedRoutes:
    async def test_access_without_token(self, client):
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 403  # HTTPBearer returns 403 when no token

    async def test_access_with_invalid_token(self, client):
        response = await client.get(
            "/api/v1/users/me",
            headers=auth_header("invalid.token.here"),
        )
        assert response.status_code == 401
