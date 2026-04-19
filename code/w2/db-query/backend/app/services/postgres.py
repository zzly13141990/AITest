"""PostgreSQL connection and metadata extraction utilities."""

import asyncpg

from app.models import ColumnMetadata, TableMetadata, ViewMetadata, DatabaseMetadata


async def test_connection(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
) -> bool:
    """Test if a PostgreSQL connection is valid.

    Args:
        host: Database host
        port: Database port
        database: Database name
        username: Username
        password: Password

    Returns:
        True if connection successful, False otherwise
    """
    try:
        conn = await asyncpg.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
        )
        await conn.close()
        return True
    except Exception:
        return False


async def fetch_tables_and_views(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
) -> DatabaseMetadata:
    """Fetch all tables and views from a PostgreSQL database.

    Uses information_schema to query table and column metadata.
    Excludes system schemas (pg_catalog, information_schema).

    Returns:
        DatabaseMetadata with tables and views
    """
    conn = await asyncpg.connect(
        host=host,
        port=port,
        database=database,
        user=username,
        password=password,
    )

    try:
        tables_rows = await conn.fetch("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
              AND table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
        """)

        tables: list[TableMetadata] = []
        for row in tables_rows:
            schema = row["table_schema"]
            table_name = row["table_name"]
            full_name = f"{schema}.{table_name}" if schema != "public" else table_name

            columns_rows = await conn.fetch("""
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            """, schema, table_name)

            columns = [
                ColumnMetadata(
                    name=col["column_name"],
                    data_type=col["data_type"],
                    is_nullable=col["is_nullable"] == "YES",
                    character_maximum_length=col["character_maximum_length"],
                )
                for col in columns_rows
            ]

            tables.append(TableMetadata(name=full_name, columns=columns))

        views_rows = await conn.fetch("""
            SELECT schemaname, viewname, definition
            FROM pg_views
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, viewname
        """)

        views: list[ViewMetadata] = []
        for row in views_rows:
            schema = row["schemaname"]
            view_name = row["viewname"]
            full_name = f"{schema}.{view_name}" if schema != "public" else view_name

            views.append(
                ViewMetadata(
                    name=full_name,
                    definition=row["definition"],
                )
            )

        return DatabaseMetadata(tables=tables, views=views)
    finally:
        await conn.close()
