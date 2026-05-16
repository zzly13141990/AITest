package com.sqlserver.mcp.execution;

import com.sqlserver.mcp.util.JsonUtils;

import java.util.LinkedHashMap;
import java.util.Map;

public class JsonFormatter implements ResultFormatter {

    @Override
    public String format(CollectResult data) {
        var map = new LinkedHashMap<String, Object>();
        map.put("columns", data.columns());
        map.put("rows", data.rows());
        map.put("total_rows", data.totalRows());
        map.put("truncated", data.truncated());
        return JsonUtils.toJson(map);
    }
}
