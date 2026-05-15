"""
LLM 调用工具：封装 OpenAI SDK 客户端，支持重试和超时。
"""

from __future__ import annotations

import asyncio
from typing import Any

from openai import AsyncOpenAI

from pg_mcp.config import LLMConfig


class LLMClient:
    """LLM API 客户端封装，支持重试和超时。"""

    def __init__(self, config: LLMConfig) -> None:
        self._config = config
        self._client = AsyncOpenAI(**config.to_dict())

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float | None = None,
        max_tokens: int | None = None,
        retry_count: int = 3,
    ) -> str:
        """
        调用 LLM chat API，带指数退避重试。

        Args:
            system_prompt: 系统提示词。
            user_prompt: 用户提示词。
            temperature: 温度（None 则使用配置默认值）。
            max_tokens: 最大 token 数（None 则使用配置默认值）。
            retry_count: 最大重试次数。

        Returns:
            LLM 返回的文本内容。

        Raises:
            MCPError: 如果 API 调用失败或超时。
        """
        from pg_mcp.constants import ErrorCode
        from pg_mcp.utils.error import MCPError

        last_error: Exception | None = None
        for attempt in range(retry_count):
            try:
                response = await self._client.chat.completions.create(
                    model=self._config.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature if temperature is not None else self._config.temperature,
                    max_tokens=max_tokens if max_tokens is not None else self._config.max_tokens,
                )
                content = response.choices[0].message.content
                if content is None:
                    raise MCPError(
                        code=ErrorCode.LLM_API_ERROR,
                        message="LLM returned empty response.",
                    )
                return content
            except MCPError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < retry_count - 1:
                    wait_time = 2**attempt
                    from pg_mcp.utils.logger import get_logger
                    logger = get_logger(__name__)
                    logger.warning(
                        "llm_retry",
                        attempt=attempt + 1,
                        max_retries=retry_count,
                        wait_seconds=wait_time,
                        error=str(exc),
                    )
                    await asyncio.sleep(wait_time)

        raise MCPError(
            code=ErrorCode.LLM_API_ERROR,
            message=f"LLM API call failed after {retry_count} retries: {last_error}",
        )

    @property
    def model(self) -> str:
        return self._config.model
