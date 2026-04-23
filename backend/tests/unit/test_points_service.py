import pytest
from unittest.mock import MagicMock

pytestmark = pytest.mark.unit


class TestCreatePoint:
    def test_create_point_calls_db_add_and_commit(self, mock_db):
        from app.services.points import create_point
        from app.schemas.points import PointBase

        data = PointBase(name="Пункт 1", address="ул. Тест 1",
                         waste_types=["plastic"], opens_at="09:00", closes_at="18:00")
        create_point(mock_db, data)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_create_point_parses_time_strings(self, mock_db):
        from app.services.points import create_point
        from app.schemas.points import PointBase
        from datetime import time

        data = PointBase(name="Пункт 2", address="ул. Тест 2",
                         waste_types=[], opens_at="08:30", closes_at="20:00")
        added = None

        def capture(obj):
            nonlocal added
            added = obj

        mock_db.add.side_effect = capture
        create_point(mock_db, data)

        assert added.opens_at == time(8, 30)
        assert added.closes_at == time(20, 0)

    def test_create_point_without_schedule_is_none(self, mock_db):
        from app.services.points import create_point
        from app.schemas.points import PointBase

        data = PointBase(name="Пункт 3", address="ул. Тест 3",
                         waste_types=[], opens_at=None, closes_at=None)
        added = None

        def capture(obj):
            nonlocal added
            added = obj

        mock_db.add.side_effect = capture
        create_point(mock_db, data)
        assert added.opens_at is None
        assert added.closes_at is None


class TestGetPoint:
    def test_get_existing_point(self, mock_db):
        from app.services.points import get_point
        point = MagicMock()
        point.id = 1
        mock_db.get.return_value = point

        result = get_point(mock_db, 1)
        assert result == point

    def test_get_nonexistent_point_returns_none(self, mock_db):
        from app.services.points import get_point
        mock_db.get.return_value = None
        assert get_point(mock_db, 999) is None


class TestDeletePoint:
    def test_delete_existing_returns_true(self, mock_db):
        from app.services.points import delete_point
        mock_db.get.return_value = MagicMock()
        assert delete_point(mock_db, 1) is True

    def test_delete_nonexistent_returns_false(self, mock_db):
        from app.services.points import delete_point
        mock_db.get.return_value = None
        assert delete_point(mock_db, 999) is False


class TestUpdatePoint:
    def test_update_nonexistent_returns_none(self, mock_db):
        from app.services.points import update_point
        from app.schemas.points import PointUpdate

        mock_db.get.return_value = None
        result = update_point(mock_db, 999, PointUpdate(name="x", address="y"))
        assert result is None
