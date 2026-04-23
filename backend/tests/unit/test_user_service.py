import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.exc import IntegrityError

pytestmark = pytest.mark.unit


class TestHashPassword:

    def test_hash_password_returns_non_empty_string(self):
        from app.services.user import _hash_password
        result = _hash_password("mypassword")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_hash_password_different_hashes_for_same_input(self):
        from app.services.user import _hash_password
        h1 = _hash_password("password123")
        h2 = _hash_password("password123")
        assert h1 != h2

    def test_verify_password_correct(self):
        from app.services.user import _hash_password, _verify_password
        hashed = _hash_password("secret")
        assert _verify_password("secret", hashed) is True

    def test_verify_password_wrong(self):
        from app.services.user import _hash_password, _verify_password
        hashed = _hash_password("secret")
        assert _verify_password("wrong", hashed) is False

    def test_verify_password_truncates_at_72_chars(self):
        from app.services.user import _hash_password, _verify_password
        long_pass = "a" * 73
        hashed = _hash_password(long_pass)
        assert _verify_password("a" * 73, hashed) is True


class TestCreateUser:
    def test_create_user_returns_user_object(self, mock_db):
        from app.services.user import create_user
        from app.schemas.user import UserCreate

        payload = UserCreate(username="alice", email="alice@test.com", password="pass123")
        mock_db.refresh = MagicMock()

        result = create_user(mock_db, payload)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_create_user_hashes_password(self, mock_db):
        from app.services.user import create_user
        from app.schemas.user import UserCreate

        payload = UserCreate(username="bob", email="bob@test.com", password="plaintext")
        added_user = None

        def capture_add(obj):
            nonlocal added_user
            added_user = obj

        mock_db.add.side_effect = capture_add
        create_user(mock_db, payload)
        assert added_user.password_hash != "plaintext"

    def test_create_user_rollback_on_integrity_error(self, mock_db):
        from app.services.user import create_user
        from app.schemas.user import UserCreate

        mock_db.commit.side_effect = IntegrityError("", {}, None)
        payload = UserCreate(username="dup", email="dup@test.com", password="pass")

        with pytest.raises(IntegrityError):
            create_user(mock_db, payload)

        mock_db.rollback.assert_called_once()


class TestAuthenticateUser:
    def test_authenticate_user_valid_credentials(self, mock_db):
        from app.services.user import authenticate_user, _hash_password

        user = MagicMock()
        user.username = "alice"
        user.password_hash = _hash_password("correct")
        mock_db.query.return_value.filter.return_value.first.return_value = user

        result = authenticate_user(mock_db, "alice", "correct")
        assert result == user

    def test_authenticate_user_wrong_password_returns_none(self, mock_db):
        from app.services.user import authenticate_user, _hash_password

        user = MagicMock()
        user.password_hash = _hash_password("correct")
        mock_db.query.return_value.filter.return_value.first.return_value = user

        result = authenticate_user(mock_db, "alice", "wrong")
        assert result is None

    def test_authenticate_user_nonexistent_user_returns_none(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        from app.services.user import authenticate_user

        result = authenticate_user(mock_db, "ghost", "pass")
        assert result is None


class TestUpdateUser:
    def test_update_user_not_found_returns_none(self, mock_db):
        from app.services.user import update_user
        from app.schemas.user import UserUpdate

        mock_db.get.return_value = None
        result = update_user(mock_db, 999, UserUpdate(username="x", email="x@x.com", password=""))
        assert result is None

    def test_update_user_changes_password_hash(self, mock_db):
        from app.services.user import update_user, _hash_password
        from app.schemas.user import UserUpdate

        user = MagicMock()
        user.password_hash = _hash_password("old_pass")
        mock_db.get.return_value = user

        update_user(mock_db, 1, UserUpdate(username="alice", email="a@a.com", password="new_pass"))

        from app.services.user import _verify_password
        assert _verify_password("new_pass", user.password_hash)


class TestDeleteUser:
    def test_delete_user_existing_returns_true(self, mock_db):
        from app.services.user import delete_user
        mock_db.get.return_value = MagicMock()
        assert delete_user(mock_db, 1) is True

    def test_delete_user_nonexistent_returns_false(self, mock_db):
        from app.services.user import delete_user
        mock_db.get.return_value = None
        assert delete_user(mock_db, 999) is False
