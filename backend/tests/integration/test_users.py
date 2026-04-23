import pytest
from unittest.mock import MagicMock, patch

pytestmark = pytest.mark.integration


class TestListUsers:
    def test_list_users_requires_admin(self, client_as_user):
        client, _ = client_as_user
        resp = client.get("/users/")
        assert resp.status_code == 403

    def test_list_users_as_admin_returns_200(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.user.user_service.list_users", return_value=[]):
            resp = client.get("/users/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestGetUser:
    def test_get_user_requires_auth(self, client):
        resp = client.get("/users/1")
        assert resp.status_code in (401, 403)

    def test_get_user_not_found_returns_404(self, client_as_user):
        client, _ = client_as_user
        with patch("app.api.user.user_service.get_user", return_value=None):
            resp = client.get("/users/999")
        assert resp.status_code == 404


class TestChangeRole:
    def test_change_role_as_admin_success(self, client_as_admin):
        client, mock_db = client_as_admin
        user = MagicMock()
        user.id = 2
        user.role = "user"
        mock_db.query.return_value.filter.return_value.first.return_value = user

        resp = client.put("/users/2/role?role=admin")
        assert resp.status_code == 200

    def test_change_role_as_user_returns_403(self, client_as_user):
        client, _ = client_as_user
        resp = client.put("/users/2/role?role=admin")
        assert resp.status_code == 403

    def test_change_role_user_not_found_returns_404(self, client_as_admin):
        client, mock_db = client_as_admin
        mock_db.query.return_value.filter.return_value.first.return_value = None
        resp = client.put("/users/999/role?role=admin")
        assert resp.status_code == 404


class TestDeleteUser:
    def test_delete_self_as_user_returns_200(self, client_as_user):
        client, _ = client_as_user
        from app.main import app
        from app.auth.deps import require_self_or_admin
        from tests.conftest import make_user
        user = make_user(id=1)
        app.dependency_overrides[require_self_or_admin] = lambda: user

        with patch("app.api.user.user_service.delete_user", return_value=True):
            resp = client.delete("/users/1")
        assert resp.status_code == 200
        app.dependency_overrides.pop(require_self_or_admin, None)

    def test_delete_other_user_as_regular_user_returns_403(self, client_as_user):
        client, _ = client_as_user
        resp = client.delete("/users/42")
        assert resp.status_code == 403
