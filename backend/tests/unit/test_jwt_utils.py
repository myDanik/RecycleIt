import pytest
import time

pytestmark = pytest.mark.unit


class TestCreateAccessToken:
    def test_creates_decodable_token(self):
        from app.auth.jwt_utils import create_access_token, decode_token
        token = create_access_token(user_id=1, role="user")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["role"] == "user"
        assert payload["type"] == "access"

    def test_access_token_different_from_refresh(self):
        from app.auth.jwt_utils import create_access_token, create_refresh_token
        access = create_access_token(user_id=1, role="user")
        refresh = create_refresh_token(user_id=1, role="user")
        assert access != refresh


class TestCreateRefreshToken:
    def test_refresh_token_has_correct_type(self):
        from app.auth.jwt_utils import create_refresh_token, decode_token
        token = create_refresh_token(user_id=5, role="user")
        payload = decode_token(token)
        assert payload["type"] == "refresh"
        assert payload["sub"] == "5"



class TestDecodeToken:
    def test_decode_invalid_token_returns_none(self):
        from app.auth.jwt_utils import decode_token
        assert decode_token("invalid.token.here") is None

    def test_decode_empty_string_returns_none(self):
        from app.auth.jwt_utils import decode_token
        assert decode_token("") is None

    def test_decode_tampered_token_returns_none(self):
        from app.auth.jwt_utils import create_access_token, decode_token
        token = create_access_token(1, "user")
        tampered = token[:-5] + "XXXXX"
        assert decode_token(tampered) is None

    def test_access_token_not_accepted_as_refresh(self):
        from app.auth.jwt_utils import create_access_token, decode_token
        token = create_access_token(1, "user")
        payload = decode_token(token)
        assert payload["type"] != "refresh"
