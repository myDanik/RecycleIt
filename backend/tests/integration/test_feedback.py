import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

pytestmark = pytest.mark.integration


def _fb_mock(id=1, point_id=1, user_id=1, message="Отлично", rating=5):
    fb = MagicMock()
    fb.id = id
    fb.point_id = point_id
    fb.user_id = user_id
    fb.message = message
    fb.rating = rating
    fb.created_at = datetime(2024, 1, 1, 12, 0, 0)
    return fb


class TestListFeedback:
    def test_list_feedback_no_auth_returns_200(self, client):
        with patch("app.api.feedback.feedback_service.list_feedbacks", return_value=[]):
            resp = client.get("/feedback/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_feedback_filter_by_point_id(self, client):
        with patch("app.api.feedback.feedback_service.list_feedbacks", return_value=[]):
            resp = client.get("/feedback/?point_id=1")
        assert resp.status_code == 200


class TestCreateFeedback:
    def test_create_feedback_requires_auth(self, client):
        resp = client.post("/feedback/", json={
            "point_id": 1, "message": "Хорошо", "rating": 5
        })
        assert resp.status_code in (401, 403)

    def test_create_feedback_as_user_returns_200(self, client_as_user):
        client, _ = client_as_user
        fb = _fb_mock()
        with patch("app.api.feedback.create_feedback", return_value=fb):
            resp = client.post("/feedback/", json={
                "point_id": 1, "message": "Хорошо", "rating": 5
            })
        assert resp.status_code == 200
        data = resp.json()
        for field in ("id", "point_id", "user_id", "message", "rating", "created_at"):
            assert field in data

    def test_create_feedback_missing_message_returns_422(self, client_as_user):
        client, _ = client_as_user
        resp = client.post("/feedback/", json={"point_id": 1})
        assert resp.status_code == 422

    def test_create_feedback_negative_rating(self, client_as_user):
        client, _ = client_as_user
        fb = _fb_mock(rating=-1)
        with patch("app.api.feedback.create_feedback", return_value=fb):
            resp = client.post("/feedback/", json={
                "point_id": 1, "message": "Ужас", "rating": -1
            })
        assert resp.status_code in (200, 422)


class TestDeleteFeedback:
    def test_delete_feedback_as_admin_returns_200(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.feedback.feedback_service.delete_feedback", return_value=True):
            resp = client.delete("/feedback/1")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"

    def test_delete_feedback_as_user_returns_403(self, client_as_user):
        client, _ = client_as_user
        resp = client.delete("/feedback/1")
        assert resp.status_code == 403

    def test_delete_feedback_not_found_returns_404(self, client_as_admin):
        client, _ = client_as_admin
        with patch("app.api.feedback.feedback_service.delete_feedback", return_value=False):
            resp = client.delete("/feedback/999")
        assert resp.status_code == 404
