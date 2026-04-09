"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "StrongPass1!",
            "full_name": "New User",
            "department": "Engineering",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "recruit"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that registering with an existing email returns 409."""
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPass1!",
        "full_name": "First User",
    }
    resp1 = await client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login returns a JWT token."""
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "StrongPass1!",
            "full_name": "Login User",
        },
    )

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "StrongPass1!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "loginuser@example.com"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with wrong password returns 401."""
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpass@example.com",
            "password": "StrongPass1!",
            "full_name": "Wrong Pass User",
        },
    )

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "WrongPassword1!"},
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent email returns 401."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "noone@example.com", "password": "StrongPass1!"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, recruit_user, recruit_token):
    """Test GET /me returns current user data when authenticated."""
    resp = await client.get("/api/v1/auth/me", headers=auth_header(recruit_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == recruit_user.email
    assert data["full_name"] == "Test Recruit"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """Test GET /me without token returns 403 (HTTPBearer rejects missing credentials)."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 403
