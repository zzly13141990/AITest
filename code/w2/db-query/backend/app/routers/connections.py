"""Database connection management API endpoints."""

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database.base import Base, get_session
from app.database.repository import ConnectionRepository
from app.models import ConnectionCreate, ConnectionResponse, ApiResponse


router = APIRouter(prefix="/connections", tags=["connections"])


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


async def _get_connection(
    connection_id: int,
    session: AsyncSession,
    repo: ConnectionRepository,
) -> ConnectionModel:
    """Helper to get a connection or raise 404."""
    connection = await repo.get_by_id(session, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.post("", response_model=ApiResponse[ConnectionResponse])
async def create_connection(
    connection: ConnectionCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Create a new database connection."""
    try:
        new_connection = await repo.create(session, connection)
        return ApiResponse(
            code=201,
            message="Connection created successfully",
            data=ConnectionResponse.model_validate(new_connection),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create connection: {str(e)}")


@router.get("", response_model=ApiResponse[list[ConnectionResponse]])
async def list_connections(
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Get all database connections."""
    try:
        connections = await repo.get_all(session)
        return ApiResponse(
            code=200,
            message="Connections retrieved successfully",
            data=[ConnectionResponse.model_validate(c) for c in connections],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve connections: {str(e)}")


@router.get("/{connection_id}", response_model=ApiResponse[ConnectionResponse])
async def get_connection(
    connection_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Get a connection by ID."""
    connection = await _get_connection(connection_id, session, repo)
    return ApiResponse(
        code=200,
        message="Connection retrieved successfully",
        data=ConnectionResponse.model_validate(connection),
    )


@router.put("/{connection_id}", response_model=ApiResponse[ConnectionResponse])
async def update_connection(
    connection_id: int,
    connection: ConnectionCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Update an existing connection."""
    await _get_connection(connection_id, session, repo)
    try:
        updated = await repo.update(session, connection_id, connection)
        return ApiResponse(
            code=200,
            message="Connection updated successfully",
            data=ConnectionResponse.model_validate(updated),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update connection: {str(e)}")


@router.delete("/{connection_id}", response_model=ApiResponse[dict])
async def delete_connection(
    connection_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Delete a connection by ID."""
    await _get_connection(connection_id, session, repo)
    try:
        await repo.delete(session, connection_id)
        return ApiResponse(
            code=200,
            message="Connection deleted successfully",
            data={"id": connection_id},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete connection: {str(e)}")


@router.post("/{connection_id}/test", response_model=ApiResponse[dict])
async def test_connection(
    connection_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Test if a PostgreSQL connection is valid."""
    connection = await _get_connection(connection_id, session, repo)
    try:
        conn = await asyncpg.connect(
            user=connection.username,
            password=connection.password,
            host=connection.host,
            port=connection.port,
            database=connection.database,
        )
        await conn.close()
        return ApiResponse(
            code=200,
            message="Connection successful",
            data={"success": True, "message": "Connection successful"},
        )
    except Exception as e:
        return ApiResponse(
            code=400,
            message=f"Connection failed: {str(e)}",
            data={"success": False, "message": str(e)},
        )
