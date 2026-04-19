"""SQL generation and execution API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database.base import get_session
from app.database.repository import ConnectionRepository, MetadataRepository, MetadataModel
from app.services.sql_validator import SqlValidator, SqlValidatorError
from app.services.query_executor import QueryExecutor
from app.services.llm_service import LlmService
from app.models.config import get_settings
from app.models import (
    ApiResponse,
    ExecuteSqlRequest,
    ExecuteSqlResponse,
    GenerateSqlRequest,
    GenerateSqlResponse,
    DatabaseMetadata,
    TableMetadata,
    ViewMetadata,
    ColumnMetadata,
)

router = APIRouter(prefix="/query", tags=["query"])

settings = get_settings()
llm_service = LlmService(api_key=settings.openai_api_key, model=settings.openai_model)


def _convert_metadata_model_to_domain(metadata: MetadataModel) -> DatabaseMetadata:
    """Convert MetadataModel from database to DatabaseMetadata domain model.

    Args:
        metadata: MetadataModel from database

    Returns:
        DatabaseMetadata domain model
    """
    tables = []
    if metadata.tables:
        for table_data in metadata.tables:
            columns = []
            if table_data.get("columns"):
                for col_data in table_data["columns"]:
                    columns.append(
                        ColumnMetadata(
                            name=col_data["name"],
                            data_type=col_data["data_type"],
                            is_nullable=col_data.get("is_nullable", False),
                            character_maximum_length=col_data.get("character_maximum_length"),
                        )
                    )
            tables.append(TableMetadata(name=table_data["name"], columns=columns))

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


@router.post("/generate-sql", response_model=ApiResponse[GenerateSqlResponse])
async def generate_sql(
    request: GenerateSqlRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    metadata_repo: Annotated[MetadataRepository, Depends(lambda: MetadataRepository())],
):
    """Generate SQL from natural language using LLM.

    1. Get connection metadata
    2. Call LLM to generate SQL
    3. Return generated SQL
    """
    metadata_model = await metadata_repo.get_by_connection_id(session, request.connection_id)
    if not metadata_model or not metadata_model.tables and not metadata_model.views:
        raise HTTPException(
            status_code=400,
            detail="No metadata available. Please extract metadata first.",
        )

    metadata = _convert_metadata_model_to_domain(metadata_model)

    try:
        result = await llm_service.generate_sql(request.prompt, metadata)
        return ApiResponse(data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")


@router.post("/execute", response_model=ApiResponse[ExecuteSqlResponse])
async def execute_sql(
    request: ExecuteSqlRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    connection_repo: Annotated[ConnectionRepository, Depends(lambda: ConnectionRepository())],
):
    """Execute a SQL query against a database.

    1. Get connection details
    2. Validate SQL (only SELECT allowed)
    3. Execute query
    4. Return results
    """
    connection = await connection_repo.get_by_id(session, request.connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        validated_sql = SqlValidator.validate(request.sql)

        result = await QueryExecutor.execute(
            host=connection.host,
            port=connection.port,
            database=connection.database,
            username=connection.username,
            password=connection.password,
            sql=validated_sql,
        )

        return ApiResponse(data=result)

    except SqlValidatorError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
