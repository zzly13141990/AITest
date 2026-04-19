"""SQL validation service using sqlglot."""

import sqlglot
from sqlglot import exp, parse


class SqlValidatorError(Exception):
    """Exception raised for SQL validation errors."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class SqlValidator:
    """Validates and transforms SQL queries."""

    @staticmethod
    def validate(sql: str) -> str:
        """Validate SQL and ensure it only contains SELECT statements.

        Args:
            sql: Raw SQL query string

        Returns:
            Validated SQL string (possibly with LIMIT added)

        Raises:
            SqlValidatorError: If SQL is invalid or contains non-SELECT statements
        """
        try:
            expressions = parse(sql)

            if not expressions:
                raise SqlValidatorError("Empty SQL statement")

            for expr in expressions:
                if not isinstance(expr, exp.Select):
                    raise SqlValidatorError(
                        f"Only SELECT statements are allowed. Found: {type(expr).__name__}"
                    )

            result_sql = SqlValidator._add_limit_if_needed(expressions)
            return result_sql

        except SqlValidatorError:
            raise
        except Exception as e:
            raise SqlValidatorError(f"SQL syntax error: {str(e)}")

    @staticmethod
    def _add_limit_if_needed(expressions: list[exp.Expression]) -> str:
        """Add LIMIT 1000 if no LIMIT clause is present."""
        result_sqls = []
        for expr in expressions:
            if isinstance(expr, exp.Select):
                has_limit = any(isinstance(node, exp.Limit) for node in expr.walk())
                if not has_limit:
                    expr = expr.limit(1000)
            result_sqls.append(expr.sql())
        return "; ".join(result_sqls)
