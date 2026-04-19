"""Tests for API endpoints using TestClient."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self):
        """Test health check returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestConnectionsApi:
    """Tests for connections API endpoints."""

    @patch("app.routers.connections.ConnectionRepository")
    def test_create_connection(self, mock_repo_class):
        """Test creating a new connection."""
        mock_repo = AsyncMock()
        mock_repo.create = AsyncMock(return_value={
            "id": 1,
            "connectionName": "Test DB",
            "host": "localhost",
            "port": 5432,
            "database": "mydb",
            "username": "user",
        })
        mock_repo_class.return_value = mock_repo

        response = client.post(
            "/api/connections",
            json={
                "name": "Test DB",
                "host": "localhost",
                "port": 5432,
                "database": "mydb",
                "username": "user",
                "password": "secret",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["connectionName"] == "Test DB"

    def test_create_connection_invalid(self):
        """Test creating a connection with invalid data."""
        response = client.post("/api/connections", json={})
        assert response.status_code == 422  # Validation error

    def test_list_connections(self):
        """Test listing connections."""
        response = client.get("/api/connections")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert isinstance(data["data"], list)

    def test_get_connection_not_found(self):
        """Test getting a non-existent connection."""
        response = client.get("/api/connections/999")
        assert response.status_code == 404


class TestMetadataApi:
    """Tests for metadata API endpoints."""

    def test_get_metadata_not_found(self):
        """Test getting metadata for non-existent connection."""
        response = client.get("/api/metadata/connections/999")
        assert response.status_code == 404


class TestQueryApi:
    """Tests for query API endpoints."""

    def test_execute_sql_no_connection(self):
        """Test executing SQL without valid connection."""
        response = client.post(
            "/api/query/execute",
            json={"connectionId": 999, "sql": "SELECT 1"},
        )
        assert response.status_code == 404

    def test_generate_sql_no_metadata(self):
        """Test generating SQL when no metadata available."""
        response = client.post(
            "/api/query/generate-sql",
            json={"connectionId": 1, "prompt": "Get all users"},
        )
        # Returns 400 if no metadata
        assert response.status_code in [400, 404]
