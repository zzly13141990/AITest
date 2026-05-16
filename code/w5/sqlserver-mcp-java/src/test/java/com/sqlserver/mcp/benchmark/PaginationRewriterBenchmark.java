package com.sqlserver.mcp.benchmark;

import com.sqlserver.mcp.execution.PaginationRewriter;
import org.openjdk.jmh.annotations.*;

import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Thread)
@Fork(value = 1, warmups = 0)
@Warmup(iterations = 2, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 3, time = 1, timeUnit = TimeUnit.SECONDS)
public class PaginationRewriterBenchmark {

    private PaginationRewriter rewriter;

    private static final String SIMPLE_SELECT = "SELECT * FROM products WHERE price > 100";
    private static final String COMPLEX_JOIN = """
        SELECT p.name, SUM(o.quantity) AS total_sold
        FROM products p
        JOIN orders o ON p.id = o.product_id
        WHERE o.order_date >= '2024-01-01'
        GROUP BY p.name
        HAVING SUM(o.quantity) > 10
        ORDER BY total_sold DESC
        """;
    private static final String CTE_WITH_WINDOW = """
        WITH ranked AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
            FROM products
        )
        SELECT * FROM ranked WHERE rn <= 3
        """;
    private static final String NESTED_SUBQUERY = """
        SELECT * FROM products
        WHERE id IN (SELECT product_id FROM orders GROUP BY product_id HAVING COUNT(*) > 5)
        """;

    @Setup
    public void setup() {
        rewriter = new PaginationRewriter();
    }

    @Benchmark
    public Object simpleSelect() {
        return rewriter.rewrite(SIMPLE_SELECT, 1, 20);
    }

    @Benchmark
    public Object complexJoin() {
        return rewriter.rewrite(COMPLEX_JOIN, 2, 50);
    }

    @Benchmark
    public Object cteWithWindow() {
        return rewriter.rewrite(CTE_WITH_WINDOW, 1, 10);
    }

    @Benchmark
    public Object nestedSubquery() {
        return rewriter.rewrite(NESTED_SUBQUERY, 1, 100);
    }
}
