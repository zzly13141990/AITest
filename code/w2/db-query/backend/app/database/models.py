"""SQLAlchemy ORM models for database connections and metadata."""

import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Column
from app.database.base import Base


class ConnectionModel(Base):
    """ORM model for the connections table."""

    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=5432)
    database_name = Column("database", String(255), nullable=False)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
    )


class MetadataModel(Base):
    """ORM model for the metadata table."""

    __tablename__ = "metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, ForeignKey("connections.id"), nullable=False)
    table_name = Column(String(255), nullable=False)
    table_type = Column(String(50), nullable=False)
    columns_json = Column(Text, nullable=True)
    definition = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
