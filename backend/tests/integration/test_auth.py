import pytest
from unittest.mock import patch, MagicMock

pytestmark = pytest.mark.integration


class TestRegister:
    def test_register_returns_201_or_200_with_user_data(self, client):
        with patch("app.api.auth.create_user") as mock_create:
            user = MagicMock()
            user.id = 1
            user.username = "alice"
            user.email = "alice@test.com"
            user.role = "user"
            mock_create.return_value = user

            resp = client.post("/auth/register", json={
                "username": "alice",
                "email": "alice@test.com",
                "password": "password123",
            })

        assert resp.status_code in (200, 201)
        data = resp.json()
        assert "id" in data
        assert "username" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_returns_422_or_500(self, client):
        from sqlalchemy.exc import IntegrityError
        with patch("app.api.auth.create_user", side_effect=IntegrityError("", {}, None)):
            resp = client.post("/auth/register", json={
                "username": "dup",
                "email": "dup@test.com",
                "password": "pass",
            })
        assert resp.status_code in (409, 422, 500)

    def test_register_missing_fields_returns_422(self, client):
        resp = client.post("/auth/register", json={"username": "only_name"})
        assert resp.status_code == 422

    def test_register_empty_body_returns_422(self, client):
        resp = client.post("/auth/register", json={})
        assert resp.status_code == 422


class TestLogin:
    def test_login_valid_credentials_returns_tokens(self, client):
        with patch("app.api.auth.authenticate_user") as mock_auth, \
             patch("app.api.auth.create_access_token", return_value="acc_token"), \
             patch("app.api.auth.create_refresh_token", return_value="ref_token"):

            user = MagicMock()
            user.id = 1
            user.username = "alice"
            user.role = "user"
            mock_auth.return_value = user

            resp = client.post("/auth/login", json={
                "username": "alice",
                "password": "password123",
            })

        assert resp.status_code == 200
        data = resp.json()
        for field in ("access_token", "refresh_token", "token_type", "role", "id", "username"):
            assert field in data, f"Поле '{field}' отсутствует в ответе"
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials_returns_401(self, client):
        with patch("app.api.auth.authenticate_user", return_value=None):
            resp = client.post("/auth/login", json={
                "username": "alice",
                "password": "wrong_password",
            })
        assert resp.status_code == 401

    def test_login_missing_password_returns_422(self, client):
        resp = client.post("/auth/login", json={"username": "alice"})
        assert resp.status_code == 422


class TestRefreshToken:
    def test_refresh_valid_token_returns_new_access_token(self, client):
        from app.auth.jwt_utils import create_refresh_token
        refresh_token = create_refresh_token(user_id=1, role="user")

        resp = client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_access_token_as_refresh_returns_401(self, client):
        from app.auth.jwt_utils import create_access_token
        access_token = create_access_token(user_id=1, role="user")

        resp = client.post("/auth/refresh", json={"refresh_token": access_token})
        assert resp.status_code == 401

    def test_refresh_invalid_token_returns_401(self, client):
        resp = client.post("/auth/refresh", json={"refresh_token": "not.a.real.token"})
        assert resp.status_code == 401
