# Database Query Tool (db-query)

An AI-powered database query tool with LLM-assisted SQL generation. Built with FastAPI (Python) and React/Refine 5.

## Features

- **Database Connection Management**: Store and manage PostgreSQL connection strings in SQLite
- **Metadata Extraction**: Automatically extract and store database schema (tables, views, columns)
- **LLM-Assisted SQL Generation**: Use natural language to generate SQL queries with OpenAI
- **SQL Validation**: Validate SQL syntax using sqlglot, only allowing SELECT statements
- **Auto LIMIT**: Automatically add LIMIT 1000 to queries that don't have one
- **SQL Editor**: Monaco Editor with SQL syntax highlighting
- **Result Display**: Display query results in an interactive table

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy (async)
- Pydantic v2
- sqlglot (SQL parsing/validation)
- asyncpg (PostgreSQL driver)
- OpenAI SDK

### Frontend
- React 18
- TypeScript
- Refine 5
- Ant Design
- Tailwind CSS
- Monaco Editor

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for target databases)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173

### Docker Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## API Endpoints

### Connections
- `POST /api/connections` - Create a new database connection
- `GET /api/connections` - List all connections
- `GET /api/connections/{id}` - Get connection details
- `PUT /api/connections/{id}` - Update a connection
- `DELETE /api/connections/{id}` - Delete a connection
- `POST /api/connections/{id}/test` - Test connection

### Metadata
- `POST /api/metadata/connections/{id}/extract` - Extract metadata from database
- `GET /api/metadata/connections/{id}` - Get stored metadata

### Queries
- `POST /api/query/generate-sql` - Generate SQL using LLM
- `POST /api/query/execute` - Execute a SQL query

## Project Structure

```
db-query/
├── backend/
│   ├── app/
│   │   ├── database/     # SQLAlchemy models and repositories
│   │   ├── models/       # Pydantic schemas
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI application
│   ├── tests/            # Unit tests
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── dataProvider/ # Refine data provider
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── main.tsx      # App entry point
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database URL | `sqlite+aiosqlite:///./db_query.db` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4` |

## Running Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## Security Notes

- Only SELECT statements are allowed for query execution
- Database credentials are stored in SQLite (consider encryption for production)
- CORS is configured to allow all origins (restrict for production)

## License

MIT
