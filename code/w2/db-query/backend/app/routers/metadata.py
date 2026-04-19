"""Metadata extraction and retrieval API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database.base import get_session
from app.database.repository import ConnectionRepository, MetadataRepository, MetadataModel
from app.services.metadata import MetadataService
from app.models import ApiResponse, DatabaseMetadata, TableMetadata, ColumnMetadata, ViewMetadata

router = APIRouter(prefix="/metadata", tags=["metadata"])


def get_metadata_service(
    connection_repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
    metadata_repo: Annotated[MetadataRepository, Depends(lambda: MetadataRepository())],
) -> MetadataService:
    """Dependency for MetadataService."""
    return MetadataService(connection_repo, metadata_repo)


def _convert_to_database_metadata(metadata: MetadataModel) -> DatabaseMetadata:
    """Convert MetadataModel to DatabaseMetadata Pydantic model."""
    tables = []
    if metadata.tables:
        for table_data in metadata.tables:
            columns = [
                ColumnMetadata(
                    name=col["name"],
                    data_type=col["data_type"],
                    is_nullable=col["is_nullable"],
                    character_maximum_length=col.get("character_maximum_length"),
                )
                for col in table_data.get("columns", [])
            ]
            tables.append(
                TableMetadata(
                    name=table_data["name"],
                    columns=columns,
                )
            )

    views = []
    if metadata.views:
        for view_data in metadata.views:
            views.append(
                ViewMetadata(
                    name=view_data["name"],
                    definition=view_data.get("definition"),
                )
            )

    return DatabaseMetadata(tables=tables, views=views)


@router.post("/connections/{connection_id}/extract", response_model=ApiResponse[dict])
async def extract_metadata(
    connection_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    service: Annotated[MetadataService, Depends(get_metadata_service)],
):
    """Trigger metadata extraction for a connection."""
    connection_repo = ConnectionRepository()
    connection = await connection_repo.get_by_id(session, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        result = await service.extract_metadata(session, connection_id)
        return ApiResponse(
            code=200,
            message="Metadata extraction completed",
            data=result,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata extraction failed: {str(e)}")


@router.get("/connections/{connection_id}", response_model=ApiResponse[DatabaseMetadata])
async def get_metadata(
    connection_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    metadata_repo: Annotated[MetadataRepository, Depends(lambda: MetadataRepository())],
):
    """Get stored metadata for a connection."""
    connection_repo = ConnectionRepository()
    connection = await connection_repo.get_by_id(session, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    metadata = await metadata_repo.get_by_connection_id(session, connection_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found. Please extract metadata first.")

    db_metadata = _convert_to_database_metadata(metadata)
    return ApiResponse(
        code=200,
        message="Metadata retrieved successfully",
        data=db_metadata,
    )
