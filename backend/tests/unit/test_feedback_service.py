import pytest
from unittest.mock import MagicMock

pytestmark = pytest.mark.unit


class TestCreateFeedback:
    def test_create_feedback_adds_and_commits(self, mock_db):
        from app.services.feedback import create_feedback
        from app.schemas.feedback import FeedbackCreate

        data = FeedbackCreate(point_id=1, message="Хорошее место", rating=5)
        create_feedback(mock_db, data, user_id=42)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_create_feedback_sets_correct_fields(self, mock_db):
        from app.services.feedback import create_feedback
        from app.schemas.feedback import FeedbackCreate

        added = None
        def capture(obj):
            nonlocal added
            added = obj
        mock_db.add.side_effect = capture

        data = FeedbackCreate(point_id=3, message="Неплохо", rating=3)
        create_feedback(mock_db, data, user_id=7)

        assert added.point_id == 3
        assert added.user_id == 7
        assert added.message == "Неплохо"
        assert added.rating == 3

    def test_create_feedback_without_rating(self, mock_db):
        from app.services.feedback import create_feedback
        from app.schemas.feedback import FeedbackCreate

        data = FeedbackCreate(point_id=1, message="Без оценки", rating=None)
        create_feedback(mock_db, data, user_id=1)
        mock_db.commit.assert_called_once()


class TestListFeedbacks:
    def test_list_all_feedbacks(self, mock_db):
        from app.services.feedback import list_feedbacks

        mock_db.query.return_value.all.return_value = []
        result = list_feedbacks(mock_db)
        assert result == []

    def test_list_feedbacks_filters_by_point_id(self, mock_db):
        from app.services.feedback import list_feedbacks

        mock_db.query.return_value.filter.return_value.all.return_value = []
        result = list_feedbacks(mock_db, point_id=1)
        mock_db.query.return_value.filter.assert_called_once()
        assert result == []


class TestDeleteFeedback:
    def test_delete_existing_feedback_returns_true(self, mock_db):
        from app.services.feedback import delete_feedback
        mock_db.get.return_value = MagicMock()
        assert delete_feedback(mock_db, 1) is True
        mock_db.delete.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_delete_nonexistent_feedback_returns_false(self, mock_db):
        from app.services.feedback import delete_feedback
        mock_db.get.return_value = None
        assert delete_feedback(mock_db, 999) is False
        mock_db.delete.assert_not_called()
