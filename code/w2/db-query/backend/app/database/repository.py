"""Database connection repository for CRUD operations."""

from typing import Any

from sqlalchemy import Column, Integer, String, select, JSON, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base
from app.models.connection import ConnectionCreate


class ConnectionModel(Base):
    """SQLAlchemy model for database connections."""

    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=5432)
    database = Column(String(100), nullable=False)
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)


class ConnectionRepository:
    """Repository for managing database connection records."""

    def __init__(self):
        """Initialize the ConnectionRepository."""
        pass

    async def create(
        self,
        session: AsyncSession,
        connection: ConnectionCreate,
    ) -> ConnectionModel:
        """Create a new database connection record."""
        db_connection = ConnectionModel(
            name=connection.name,
            host=connection.host,
            port=connection.port,
            database=connection.database,
            username=connection.username,
            password=connection.password,
        )
        session.add(db_connection)
        await session.flush()
        await session.refresh(db_connection)
        return db_connection

    async def get_by_id(
        self,
        session: AsyncSession,
        connection_id: int,
    ) -> ConnectionModel | None:
        """Get a connection by its ID."""
        result = await session.execute(
            select(ConnectionModel).where(ConnectionModel.id == connection_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        session: AsyncSession,
    ) -> list[ConnectionModel]:
        """Get all database connections."""
        result = await session.execute(select(ConnectionModel))
        return list(result.scalars().all())

    async def update(
        self,
        session: AsyncSession,
        connection_id: int,
        connection: ConnectionCreate,
    ) -> ConnectionModel | None:
        """Update an existing connection."""
        db_connection = await self.get_by_id(session, connection_id)
        if not db_connection:
            return None
        db_connection.name = connection.name
        db_connection.host = connection.host
        db_connection.port = connection.port
        db_connection.database = connection.database
        db_connection.username = connection.username
        db_connection.password = connection.password
        await session.flush()
        await session.refresh(db_connection)
        return db_connection

    async def delete(
        self,
        session: AsyncSession,
        connection_id: int,
    ) -> bool:
        """Delete a connection by ID. Returns True if deleted, False if not found."""
        db_connection = await self.get_by_id(session, connection_id)
        if not db_connection:
            return False
        await session.delete(db_connection)
        await session.flush()
        return True


class MetadataModel(Base):
    """SQLAlchemy model for storing extracted database metadata."""

    __tablename__ = "metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, nullable=False, index=True)
    tables = Column(JSON, nullable=True)
    views = Column(JSON, nullable=True)


class MetadataRepository:
    """Repository for managing database metadata records."""

    def __init__(self):
        """Initialize the MetadataRepository."""
        pass

    async def get_by_connection_id(
        self,
        session: AsyncSession,
        connection_id: int,
    ) -> MetadataModel | None:
        """Get metadata by connection ID."""
        result = await session.execute(
            select(MetadataModel).where(MetadataModel.connection_id == connection_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        session: AsyncSession,
        connection_id: int,
        tables: list[dict[str, Any]],
        views: list[dict[str, Any]],
    ) -> MetadataModel:
        """Insert or update metadata for a connection."""
        existing = await self.get_by_connection_id(session, connection_id)
        if existing:
            existing.tables = tables
            existing.views = views
            await session.flush()
            await session.refresh(existing)
            return existing

        metadata = MetadataModel(
            connection_id=connection_id,
            tables=tables,
            views=views,
        )
        session.add(metadata)
        await session.flush()
        await session.refresh(metadata)
        return metadata

    async def delete_by_connection_id(
        self,
        session: AsyncSession,
        connection_id: int,
    ) -> bool:
        """Delete metadata by connection ID. Returns True if deleted, False if not found."""
        existing = await self.get_by_connection_id(session, connection_id)
        if not existing:
            return False
        await session.delete(existing)
        await session.flush()
        return True
