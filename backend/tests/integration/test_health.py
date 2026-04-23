import pytest

pytestmark = pytest.mark.integration


def test_health_returns_200(client):
    resp = client.get("/health")
    assert resp.status_code == 200
