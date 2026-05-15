"""MCP 工具注册验证测试。"""

from __future__ import annotations

import pytest

from pg_mcp.main import mcp


@pytest.mark.integration
@pytest.mark.asyncio
async def test_all_tools_registered() -> None:
    """验证所有 MCP Tool 已正确注册。"""
    tools = await mcp.list_tools()
    tool_names = {t.name for t in tools}
    expected_tools = {
        "query_database",
        "generate_sql",
        "list_databases",
        "get_schema",
        "refresh_schema",
        "health_check",
    }
    assert expected_tools.issubset(tool_names), f"Missing tools: {expected_tools - tool_names}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_all_resources_registered() -> None:
    """验证所有 MCP Resource 已正确注册。"""
    templates = await mcp.list_resource_templates()
    template_uris = {t.uri_template for t in templates}
    expected_uris = {"schema://{database_name}", "history://{user_id}"}
    assert expected_uris.issubset(template_uris), f"Missing resource templates: {expected_uris - template_uris}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_tool_signatures() -> None:
    """验证关键 Tool 的参数签名。"""
    # query_database 应有 query 参数
    query_tool = await mcp.get_tool("query_database")
    assert query_tool is not None
    params = query_tool.parameters.get("properties", {})
    assert "query" in params

    # health_check 应无参数
    health_tool = await mcp.get_tool("health_check")
    assert health_tool is not None
    fn_params = health_tool.fn.__code__.co_varnames[:health_tool.fn.__code__.co_argcount]
    assert len(fn_params) == 0