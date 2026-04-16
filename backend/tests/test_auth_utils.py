"""Unit tests for auth utilities: JWT, password hashing, and dependencies."""

import uuid
from datetime import date

import pytest
from jose import JWTError

from app.auth.jwt import (
    _blocklist,
    blocklist_token,
    create_access_token,
    decode_access_token,
)
from app.auth.password import hash_password, verify_password


# --- Password hashing ---


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "MySecretP@ss1"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed)

    def test_wrong_password_fails(self):
        hashed = hash_password("CorrectP@ss1")
        assert not verify_password("WrongP@ss1", hashed)

    def test_different_hashes_for_same_password(self):
        password = "SamePass@1"
        h1 = hash_password(password)
        h2 = hash_password(password)
        assert h1 != h2  # bcrypt uses different salts

    def test_empty_password_verifies_false(self):
        hashed = hash_password("SomeP@ss1")
        assert not verify_password("", hashed)


# --- JWT ---


class TestJWT:
    def setup_method(self):
        _blocklist.clear()

    def test_create_and_decode_token(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "recruit")
        payload = decode_access_token(token)

        assert payload["sub"] == str(user_id)
        assert payload["role"] == "recruit"
        assert "jti" in payload
        assert "exp" in payload
        assert "iat" in payload

    def test_token_contains_correct_role(self):
        user_id = uuid.uuid4()
        for role in ("recruit", "manager", "admin"):
            token = create_access_token(user_id, role)
            payload = decode_access_token(token)
            assert payload["role"] == role

    def test_invalid_token_raises(self):
        with pytest.raises(JWTError):
            decode_access_token("invalid.token.here")

    def test_tampered_token_raises(self):
        token = create_access_token(uuid.uuid4(), "recruit")
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_access_token(tampered)

    def test_blocklist_token(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "recruit")

        # Token should work before blocklisting
        payload = decode_access_token(token)
        assert payload["sub"] == str(user_id)

        # Blocklist the token
        blocklist_token(token)

        # Token should be rejected after blocklisting
        with pytest.raises(JWTError, match="Token has been revoked"):
            decode_access_token(token)

    def test_blocklist_invalid_token_no_error(self):
        # Should not raise even with invalid token
        blocklist_token("not.a.valid.token")

    def test_different_tokens_have_different_jti(self):
        user_id = uuid.uuid4()
        t1 = create_access_token(user_id, "recruit")
        t2 = create_access_token(user_id, "recruit")
        p1 = decode_access_token(t1)
        p2 = decode_access_token(t2)
        assert p1["jti"] != p2["jti"]
