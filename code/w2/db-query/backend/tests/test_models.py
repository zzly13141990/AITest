"""Tests for Pydantic data model validation."""
import pytest
from pydantic import ValidationError

from app.models.connection import ConnectionCreate, ConnectionResponse
from app.models.sql import GenerateSqlRequest, ExecuteSqlRequest
from app.models.metadata import ColumnMetadata, TableMetadata


class TestConnectionModels:
    """Tests for connection-related Pydantic models."""

    def test_connection_create_valid(self):
        """Test valid connection creation."""
        data = {
            "name": "Test DB",
            "host": "localhost",
            "port": 5432,
            "database": "mydb",
            "username": "user",
            "password": "secret",
        }
        conn = ConnectionCreate(**data)
        assert conn.name == "Test DB"
        assert conn.port == 5432

    def test_connection_create_name_required(self):
        """Test that name is required."""
        with pytest.raises(ValidationError):
            ConnectionCreate(
                name="",
                host="localhost",
                port=5432,
                database="mydb",
                username="user",
                password="secret",
            )

    def test_connection_create_port_range(self):
        """Test port number validation."""
        with pytest.raises(ValidationError):
            ConnectionCreate(
                name="Test DB",
                host="localhost",
                port=0,
                database="mydb",
                username="user",
                password="secret",
            )

    def test_connection_response_from_orm(self):
        """Test ConnectionResponse construction from ORM object."""
        mock_orm = type(
            "MockConnection",
            (),
            {
                "id": 1,
                "name": "Test DB",
                "host": "localhost",
                "port": 5432,
                "database": "mydb",
                "username": "user",
                "password": "secret",
            },
        )()
        resp = ConnectionResponse.model_validate(mock_orm)
        assert resp.id == 1
        assert resp.name == "Test DB"


class TestSqlModels:
    """Tests for SQL-related Pydantic models."""

    def test_generate_sql_request_valid(self):
        """Test valid SQL generation request."""
        data = {"connectionId": 1, "prompt": "Get all users"}
        req = GenerateSqlRequest(**data)
        assert req.connection_id == 1
        assert req.prompt == "Get all users"

    def test_generate_sql_request_prompt_required(self):
        """Test that prompt is required."""
        with pytest.raises(ValidationError):
            GenerateSqlRequest(connectionId=1, prompt="")

    def test_execute_sql_request_valid(self):
        """Test valid SQL execution request."""
        data = {"connectionId": 1, "sql": "SELECT * FROM users"}
        req = ExecuteSqlRequest(**data)
        assert req.connection_id == 1
        assert req.sql == "SELECT * FROM users"


class TestMetadataModels:
    """Tests for metadata Pydantic models."""

    def test_column_metadata(self):
        """Test ColumnMetadata model."""
        col = ColumnMetadata(name="id", dataType="integer", isNullable=False)
        assert col.column_name == "id"
        assert col.data_type == "integer"
        assert col.is_nullable is False

    def test_table_metadata(self):
        """Test TableMetadata model."""
        table = TableMetadata(
            name="users",
            columns=[
                ColumnMetadata(name="id", dataType="integer", isNullable=False),
            ],
        )
        assert table.name == "users"
        assert len(table.columns) == 1

    def test_camelcase_serialization(self):
        """Test that models serialize to camelCase."""
        col = ColumnMetadata(name="id", dataType="text", isNullable=True)
        serialized = col.model_dump(by_alias=True)
        assert "columnName" in serialized
        assert "dataType" in serialized
        assert "isNullable" in serialized
