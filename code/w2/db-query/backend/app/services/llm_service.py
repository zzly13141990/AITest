"""LLM service for SQL generation using OpenAI SDK."""

import re

from openai import AsyncOpenAI

from app.models import DatabaseMetadata, GenerateSqlResponse


class LlmService:
    """Service for generating SQL queries using LLM."""

    def __init__(self, api_key: str, model: str = "gpt-4") -> None:
        """Initialize LLM service.

        Args:
            api_key: OpenAI API key
            model: OpenAI model to use
        """
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def generate_sql(
        self,
        prompt: str,
        metadata: DatabaseMetadata,
    ) -> GenerateSqlResponse:
        """Generate SQL from natural language using LLM.

        Args:
            prompt: Natural language query description
            metadata: Database metadata for context

        Returns:
            GenerateSqlResponse with generated SQL

        Raises:
            Exception: If LLM call fails
        """
        system_prompt = self._build_system_prompt(metadata)
        user_message = f"请生成SQL查询: {prompt}"

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
        )

        sql = response.choices[0].message.content or ""
        sql = self._extract_sql(sql)

        return GenerateSqlResponse(sql=sql)

    @staticmethod
    def _build_system_prompt(metadata: DatabaseMetadata) -> str:
        """Build system prompt with database schema context.

        Args:
            metadata: Database metadata including tables and views

        Returns:
            System prompt string
        """
        schema_info = LlmService._format_schema(metadata)

        return f"""你是一个专业的SQL专家。请根据用户提供的数据库结构和查询需求，生成准确的SQL查询语句。

数据库结构：
{schema_info}

规则：
1. 只生成SQL查询语句，不要包含任何解释
2. 使用标准的PostgreSQL语法
3. 如果用户没有指定LIMIT，请添加 LIMIT 100
4. 使用表别名来提高可读性
5. 对于日期比较，使用标准的SQL日期函数
6. 返回的SQL必须是可执行的，不要包含markdown标记"""

    @staticmethod
    def _format_schema(metadata: DatabaseMetadata) -> str:
        """Format database metadata into a readable schema description.

        Args:
            metadata: Database metadata

        Returns:
            Formatted schema string
        """
        lines = []

        for table in metadata.tables:
            lines.append(f"\n表: {table.name}")
            for col in table.columns:
                nullable = "NULL" if col.is_nullable else "NOT NULL"
                lines.append(f"  - {col.name} ({col.data_type}) {nullable}")

        for view in metadata.views:
            lines.append(f"\n视图: {view.name}")
            if view.definition:
                lines.append(f"  定义: {view.definition[:200]}...")

        return "\n".join(lines)

    @staticmethod
    def _extract_sql(text: str) -> str:
        """Extract SQL from LLM response, removing markdown code blocks.

        Args:
            text: Raw LLM response

        Returns:
            Clean SQL string
        """
        if "```" in text:
            sql_match = re.search(r"```(?:sql)?\s*\n?(.*?)```", text, re.DOTALL)
            if sql_match:
                text = sql_match.group(1)

        return text.strip()
