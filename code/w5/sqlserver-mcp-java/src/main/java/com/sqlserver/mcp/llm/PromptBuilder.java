package com.sqlserver.mcp.llm;

public final class PromptBuilder {

    private PromptBuilder() {}

    public static final String SYSTEM_PROMPT_TEMPLATE = """
        You are a T-SQL expert. Your task is to convert natural language questions into precise, efficient T-SQL queries.

        Database Schema:
        {schema_context}

        Rules:
        1. Always use proper T-SQL syntax compatible with SQL Server 2022
        2. Use schema-qualified table names (e.g., dbo.Users)
        3. Use TOP instead of LIMIT
        4. Use GETDATE() for current date/time
        5. Use square brackets for identifiers with special characters
        6. Return only the SQL query in a code block, no explanations
        7. If the question cannot be answered with the available schema, return a comment explaining why
        8. Use parameterized queries where appropriate (e.g., @param1, @param2)
        9. Consider performance: use EXISTS instead of IN where applicable
        10. Use appropriate JOIN types (INNER JOIN, LEFT JOIN, etc.)
        """;

    public static final String MEANING_VALIDATION_PROMPT = """
        Compare the following natural language query with the generated SQL and sample result.

        User Query: {user_query}

        Generated SQL: {sql}

        Sample Result: {sample}

        On a scale of 0.0 to 1.0, how well does the SQL answer the user's query considering the sample result?
        Consider:
        - Does the SQL capture the intent of the query?
        - Are the columns and tables in the SQL relevant to the query?
        - Based on the sample result, does the output make sense for the query?

        Respond with ONLY a number between 0.0 and 1.0, nothing else.
        """;

    public static String buildSqlPrompt(String schemaContext, String userQuery) {
        return SYSTEM_PROMPT_TEMPLATE.replace("{schema_context}", schemaContext)
            + "\nUser query: " + userQuery;
    }

    public static String buildValidationPrompt(String userQuery, String sql, String sample) {
        return MEANING_VALIDATION_PROMPT
            .replace("{user_query}", userQuery != null ? userQuery : "")
            .replace("{sql}", sql != null ? sql : "")
            .replace("{sample}", sample != null ? sample : "");
    }
}
