"""PostgreSQL query execution service."""

import asyncpg
from datetime import date, datetime
from typing import Any

from app.models import ExecuteSqlResponse


class QueryExecutor:
    """Executes SQL queries against PostgreSQL databases."""

    @staticmethod
    async def execute(
        host: str,
        port: int,
        database: str,
        username: str,
        password: str,
        sql: str,
    ) -> ExecuteSqlResponse:
        """Execute a SQL query and return results.

        Args:
            host: Database host
            port: Database port
            database: Database name
            username: Username
            password: Password
            sql: Validated SQL query

        Returns:
            ExecuteSqlResponse with columns, rows, and row_count
        """
        conn = await asyncpg.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
        )
        try:
            rows = await conn.fetch(sql)
            columns = list(rows[0].keys()) if rows else []

            result_rows = []
            for row in rows:
                result_rows.append(dict(row))

            result_rows = QueryExecutor._serialize_rows(result_rows)

            return ExecuteSqlResponse(
                columns=columns,
                rows=result_rows,
                row_count=len(rows),
            )
        finally:
            await conn.close()

    @staticmethod
    def _serialize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert non-JSON-serializable types to serializable formats."""
        result = []
        for row in rows:
            serialized_row = {}
            for key, value in row.items():
                if isinstance(value, (datetime, date)):
                    serialized_row[key] = value.isoformat()
                elif isinstance(value, bytes):
                    serialized_row[key] = value.hex()
                else:
                    serialized_row[key] = value
            result.append(serialized_row)
        return result
