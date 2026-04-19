"""Metadata extraction service."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import ConnectionRepository, MetadataRepository
from app.services.postgres import fetch_tables_and_views
from app.models import DatabaseMetadata


class MetadataService:
    """Service for extracting and storing database metadata."""

    def __init__(
        self,
        connection_repo: ConnectionRepository,
        metadata_repo: MetadataRepository,
    ):
        """Initialize the MetadataService.

        Args:
            connection_repo: Repository for database connections
            metadata_repo: Repository for metadata storage
        """
        self.connection_repo = connection_repo
        self.metadata_repo = metadata_repo

    async def extract_metadata(
        self,
        session: AsyncSession,
        connection_id: int,
    ) -> dict[str, int]:
        """Extract metadata for a database connection.

        1. Get connection details from repository
        2. Connect to PostgreSQL and fetch metadata
        3. Delete existing metadata for this connection
        4. Save new metadata
        5. Return counts of tables and views extracted

        Args:
            session: Database session
            connection_id: ID of the connection to extract metadata for

        Returns:
            Dictionary with tablesCount and viewsCount

        Raises:
            ValueError: If connection not found
            Exception: If PostgreSQL connection fails
        """
        connection = await self.connection_repo.get_by_id(session, connection_id)
        if not connection:
            raise ValueError(f"Connection with id {connection_id} not found")

        db_metadata = await fetch_tables_and_views(
            host=connection.host,
            port=connection.port,
            database=connection.database,
            username=connection.username,
            password=connection.password,
        )

        await self.metadata_repo.delete_by_connection_id(session, connection_id)

        tables_data = [
            {
                "name": table.name,
                "columns": [
                    {
                        "name": col.name,
                        "data_type": col.data_type,
                        "is_nullable": col.is_nullable,
                        "character_maximum_length": col.character_maximum_length,
                    }
                    for col in table.columns
                ],
            }
            for table in db_metadata.tables
        ]

        views_data = [
            {
                "name": view.name,
                "definition": view.definition,
            }
            for view in db_metadata.views
        ]

        await self.metadata_repo.upsert(
            session,
            connection_id,
            tables_data,
            views_data,
        )

        return {
            "tablesCount": len(db_metadata.tables),
            "viewsCount": len(db_metadata.views),
        }
