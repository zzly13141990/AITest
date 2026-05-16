package com.sqlserver.mcp.benchmark;

import com.sqlserver.mcp.execution.CollectResult;
import com.sqlserver.mcp.execution.JsonFormatter;
import com.sqlserver.mcp.execution.TextFormatter;
import org.openjdk.jmh.annotations.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Thread)
@Fork(value = 1, warmups = 0)
@Warmup(iterations = 2, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 3, time = 1, timeUnit = TimeUnit.SECONDS)
public class ResultFormatterBenchmark {

    private TextFormatter textFormatter;
    private JsonFormatter jsonFormatter;
    private CollectResult smallResult;
    private CollectResult largeResult;
    private CollectResult singleColumnResult;

    @Setup
    public void setup() {
        textFormatter = new TextFormatter();
        jsonFormatter = new JsonFormatter();

        var columns = List.of("id", "name", "category", "price", "stock");

        // Small result: 10 rows
        smallResult = new CollectResult(columns, generateRows(columns.size(), 10), 10, false, 500);

        // Large result: 1000 rows
        largeResult = new CollectResult(columns, generateRows(columns.size(), 1000), 1000, false, 50_000);

        // Single column: 100 rows
        singleColumnResult = new CollectResult(
            List.of("name"), generateRows(1, 100), 100, false, 2000
        );
    }

    private List<List<Object>> generateRows(int numCols, int numRows) {
        var rows = new ArrayList<List<Object>>();
        for (int i = 0; i < numRows; i++) {
            var row = new ArrayList<>();
            for (int j = 0; j < numCols; j++) {
                row.add("val_" + i + "_" + j);
            }
            rows.add(row);
        }
        return rows;
    }

    @Benchmark
    public Object textSmall() {
        return textFormatter.format(smallResult);
    }

    @Benchmark
    public Object textLarge() {
        return textFormatter.format(largeResult);
    }

    @Benchmark
    public Object textSingleColumn() {
        return textFormatter.format(singleColumnResult);
    }

    @Benchmark
    public Object jsonSmall() {
        return jsonFormatter.format(smallResult);
    }

    @Benchmark
    public Object jsonLarge() {
        return jsonFormatter.format(largeResult);
    }

    @Benchmark
    public Object jsonSingleColumn() {
        return jsonFormatter.format(singleColumnResult);
    }
}
