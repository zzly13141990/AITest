"""Tests for SQL validation logic."""
import pytest

from app.services.sql_validator import SqlValidator, SqlValidatorError


class TestSqlValidator:
    """Tests for SQL validation service."""

    def test_valid_select_query(self):
        """Test that valid SELECT queries pass."""
        sql = "SELECT * FROM users"
        result = SqlValidator.validate(sql)
        assert "SELECT" in result.upper()

    def test_select_with_where(self):
        """Test SELECT with WHERE clause."""
        sql = "SELECT id, name FROM users WHERE age > 18"
        result = SqlValidator.validate(sql)
        assert "SELECT" in result.upper()
        assert "WHERE" in result.upper()

    def test_insert_rejected(self):
        """Test that INSERT statements are rejected."""
        with pytest.raises(SqlValidatorError) as exc_info:
            SqlValidator.validate("INSERT INTO users VALUES (1, 'John')")
        assert "Only SELECT statements" in str(exc_info.value)

    def test_update_rejected(self):
        """Test that UPDATE statements are rejected."""
        with pytest.raises(SqlValidatorError) as exc_info:
            SqlValidator.validate("UPDATE users SET name = 'John'")
        assert "Only SELECT statements" in str(exc_info.value)

    def test_delete_rejected(self):
        """Test that DELETE statements are rejected."""
        with pytest.raises(SqlValidatorError) as exc_info:
            SqlValidator.validate("DELETE FROM users WHERE id = 1")
        assert "Only SELECT statements" in str(exc_info.value)

    def test_drop_rejected(self):
        """Test that DROP statements are rejected."""
        with pytest.raises(SqlValidatorError) as exc_info:
            SqlValidator.validate("DROP TABLE users")
        assert "Only SELECT statements" in str(exc_info.value)

    def test_auto_add_limit(self):
        """Test that LIMIT is automatically added when missing."""
        sql = "SELECT * FROM users"
        result = SqlValidator.validate(sql)
        assert "LIMIT" in result.upper()

    def test_no_limit_added_when_present(self):
        """Test that LIMIT is not added if already present."""
        sql = "SELECT * FROM users LIMIT 10"
        result = SqlValidator.validate(sql)
        # Should only have one LIMIT
        assert result.upper().count("LIMIT") == 1

    def test_empty_sql_rejected(self):
        """Test that empty SQL is rejected."""
        with pytest.raises(SqlValidatorError):
            SqlValidator.validate("")

    def test_invalid_syntax_rejected(self):
        """Test that invalid SQL syntax is rejected."""
        with pytest.raises(SqlValidatorError):
            SqlValidator.validate("SELECTT * FORM users")

    def test_select_with_join(self):
        """Test SELECT with JOIN is allowed."""
        sql = "SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id"
        result = SqlValidator.validate(sql)
        assert "SELECT" in result.upper()
        assert "JOIN" in result.upper()
