import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

os.environ.setdefault("APP_NAME", "RecycleIt-Test")
os.environ.setdefault("APP_VERSION", "0.0.0")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("SECRET_KEY", "super-secret-test-key-32-chars!!")
os.environ.setdefault("S3_ENDPOINT", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "minioadmin")
os.environ.setdefault("S3_SECRET_KEY", "minioadmin")
os.environ.setdefault("S3_BUCKET", "test-bucket")


def make_user(id=1, username="testuser", email="test@example.com",
              role="user", password_hash=None):
    from app.services.user import _hash_password
    user = MagicMock()
    user.id = id
    user.username = username
    user.email = email
    user.role = role
    user.password_hash = password_hash or _hash_password("password123")
    return user


def make_admin(id=99, username="admin", email="admin@example.com"):
    return make_user(id=id, username=username, email=email, role="admin")


def make_point(id=1, name="Пункт A", address="ул. Ленина 1",
               waste_types=None, photo_key=None):
    point = MagicMock()
    point.id = id
    point.name = name
    point.address = address
    point.waste_types = waste_types or ["plastic", "glass"]
    point.photo_key = photo_key
    point.opens_at = None
    point.closes_at = None
    point.latitude = 55.75
    point.longitude = 37.61
    return point


def make_feedback(id=1, point_id=1, user_id=1, message="Хорошее место", rating=5):
    from datetime import datetime
    fb = MagicMock()
    fb.id = id
    fb.point_id = point_id
    fb.user_id = user_id
    fb.message = message
    fb.rating = rating
    fb.created_at = datetime(2024, 1, 1, 12, 0, 0)
    return fb


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.query.return_value = db
    db.filter.return_value = db
    db.first.return_value = None
    db.all.return_value = []
    return db


@pytest.fixture(autouse=True)
def mock_geocode():
    with patch("app.services.points.geocode_address", return_value=(55.75, 37.61)):
        yield


@pytest.fixture(autouse=True)
def mock_s3_client():
    with patch("app.services.storage.s3") as mock_s3:
        mock_s3.put_object.return_value = {}
        mock_s3.generate_presigned_url.return_value = "https://s3.example.com/key"
        mock_s3.delete_object.return_value = {}
        yield mock_s3


@pytest.fixture
def client(mock_db):
    from app.main import app
    from app.db.session import get_db

    def override_get_db():
        try:
            yield mock_db
        finally:
            mock_db.rollback()
            mock_db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def client_as_user(client, mock_db):
    from app.main import app
    from app.auth.deps import get_current_user
    user = make_user()
    app.dependency_overrides[get_current_user] = lambda: user
    yield client, mock_db
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def client_as_admin(client, mock_db):
    from app.main import app
    from app.auth.deps import get_current_user, get_admin_user
    admin = make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_admin_user] = lambda: admin
    yield client, mock_db
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_admin_user, None)
