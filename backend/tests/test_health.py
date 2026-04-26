"""
Test Health Check — Basic API tests.
Chạy: pytest tests/ (từ thư mục backend/)
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test /api/health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert "version" in data


def test_articles_endpoint_exists():
    """Test /api/articles endpoint tồn tại."""
    response = client.get("/api/articles/")
    # Có thể fail nếu DB chưa kết nối, nhưng endpoint phải tồn tại
    assert response.status_code in [200, 500]


def test_tags_endpoint_exists():
    """Test /api/tags endpoint tồn tại."""
    response = client.get("/api/tags/")
    assert response.status_code in [200, 500]


def test_login_missing_fields():
    """Test login với dữ liệu thiếu."""
    response = client.post("/api/users/login", json={})
    assert response.status_code == 422  # Validation error
