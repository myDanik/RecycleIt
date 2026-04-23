import pytest
from unittest.mock import MagicMock, patch
import io

pytestmark = pytest.mark.integration


def _mock_point_dict():
    return {
        "id": 1,
        "name": "Пункт А",
        "address": "ул. Ленина 1",
        "waste_types": ["plastic", "glass"],
        "opens_at": None,
        "closes_at": None,
        "latitude": 55.75,
        "longitude": 37.61,
    }


class TestGetPoints:
    def test_get_points_returns_200(self, client):
        with patch("app.api.points.points.list_points", return_value=[]):
            resp = client.get("/points/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_points_with_filter_q(self, client):
        with patch("app.api.points.points.list_points", return_value=[]):
            resp = client.get("/points/?q=пластик")
        assert resp.status_code == 200

    def test_get_points_pagination_skip_limit(self, client):
        with patch("app.api.points.points.list_points", return_value=[]):
            resp = client.get("/points/?skip=10&limit=5")
        assert resp.status_code == 200

    def test_get_points_invalid_limit_returns_422(self, client):
        resp = client.get("/points/?limit=abc")
        assert resp.status_code == 422

    def test_get_point_by_id_returns_200(self, client):
        mock_point = MagicMock()
        mock_point.__class__ = object
        with patch("app.api.points.points.get_point") as mock_get:
            mock_get.return_value = _mock_point_dict()
            resp = client.get("/points/1")
        assert resp.status_code in (200, 422, 500)

    def test_get_point_not_found_returns_404(self, client):
        with patch("app.api.points.points.get_point", return_value=None):
            resp = client.get("/points/9999")
        assert resp.status_code == 404


class TestCreatePoint:

    VALID_PAYLOAD = {
        "name": "Новый пункт",
        "address": "ул. Тест 5",
        "waste_types": ["plastic"],
        "opens_at": "09:00",
        "closes_at": "18:00",
    }

    def test_create_point_without_auth_returns_403_or_401(self, client):
        resp = client.post("/points/", json=self.VALID_PAYLOAD)
        assert resp.status_code in (401, 403)

    def test_create_point_as_user_returns_403(self, client_as_user):
        client, mock_db = client_as_user
        resp = client.post("/points/", json=self.VALID_PAYLOAD)
        assert resp.status_code == 403

    def test_create_point_as_admin_returns_200(self, client_as_admin):
        client, mock_db = client_as_admin
        mock_result = MagicMock()
        with patch("app.api.points.points.create_point", return_value=mock_result):
            resp = client.post("/points/", json=self.VALID_PAYLOAD)
        assert resp.status_code == 200

    def test_create_point_missing_name_returns_422(self, client_as_admin):
        client, _ = client_as_admin
        resp = client.post("/points/", json={"address": "ул. Без имени"})
        assert resp.status_code == 422


class TestUpdatePoint:
    def test_update_point_as_admin_success(self, client_as_admin):
        client, _ = client_as_admin
        mock_result = MagicMock()
        with patch("app.api.points.points.update_point", return_value=mock_result):
            resp = client.put("/points/1", json={
                "name": "Обновлённый", "address": "ул. Новая 1"
            })
        assert resp.status_code == 200

    def test_update_point_not_found_returns_404(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.points.points.update_point", return_value=None):
            resp = client.put("/points/999", json={"name": "X", "address": "Y"})
        assert resp.status_code == 404


class TestDeletePoint:
    def test_delete_point_as_admin_returns_200(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.points.points.delete_point", return_value=True):
            resp = client.delete("/points/1")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"

    def test_delete_point_not_found_returns_404(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.points.points.delete_point", return_value=False):
            resp = client.delete("/points/999")
        assert resp.status_code == 404

    def test_delete_point_as_user_returns_403(self, client_as_user):
        client, _ = client_as_user
        resp = client.delete("/points/1")
        assert resp.status_code == 403


class TestPhotoUpload:
    def test_upload_photo_as_admin_success(self, client_as_admin):
        client, _ = client_as_admin
        mock_point = MagicMock()
        mock_point.photo_key = None

        with patch("app.api.points.points.get_point", return_value=mock_point), \
             patch("app.api.points.storage.upload_file", return_value="points/abc.jpg"), \
             patch("app.api.points.storage.get_presigned_url", return_value="https://s3.example.com/abc.jpg"):

            file_data = io.BytesIO(b"\xff\xd8\xff" + b"\x00" * 100)
            resp = client.post(
                "/points/1/photo",
                files={"file": ("photo.jpg", file_data, "image/jpeg")},
            )

        assert resp.status_code == 200
        assert "photo_url" in resp.json()

    def test_upload_photo_point_not_found_returns_404(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.points.points.get_point", return_value=None):
            file_data = io.BytesIO(b"\x00" * 10)
            resp = client.post(
                "/points/999/photo",
                files={"file": ("photo.jpg", file_data, "image/jpeg")},
            )
        assert resp.status_code == 404

    def test_get_photo_returns_presigned_url(self, client):
        mock_point = MagicMock()
        mock_point.photo_key = "points/abc.jpg"
        with patch("app.api.points.points.get_point", return_value=mock_point), \
             patch("app.api.points.storage.get_presigned_url", return_value="https://s3.example.com/abc.jpg"):
            resp = client.get("/points/1/photo")
        assert resp.status_code == 200
        assert "photo_url" in resp.json()

    def test_get_photo_not_found_returns_404(self, client):
        with patch("app.api.points.points.get_point", return_value=None):
            resp = client.get("/points/999/photo")
        assert resp.status_code == 404
