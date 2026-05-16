package com.sqlserver.mcp.util;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class JsonUtilsTest {

    @Test
    void toJson_shouldSerializeMap() {
        var json = JsonUtils.toJson(Map.of("key", "value"));
        assertTrue(json.contains("\"key\""));
        assertTrue(json.contains("\"value\""));
    }

    @Test
    void toJson_shouldSerializeList() {
        var json = JsonUtils.toJson(List.of(1, 2, 3));
        assertEquals("[1,2,3]", json);
    }

    @Test
    void fromJson_shouldDeserializeMap() {
        var result = JsonUtils.fromJson("{\"name\":\"test\"}", Map.class);
        assertEquals("test", result.get("name"));
    }

    @Test
    void fromJson_shouldDeserializeString() {
        var result = JsonUtils.fromJson("\"hello\"", String.class);
        assertEquals("hello", result);
    }

    @Test
    void mapper_shouldReturnSingleton() {
        assertSame(JsonUtils.mapper(), JsonUtils.mapper());
    }

    @Test
    void toBytes_shouldReturnByteArray() {
        var bytes = JsonUtils.toBytes(Map.of("a", 1));
        assertTrue(bytes.length > 0);
        var restored = JsonUtils.fromJson(new String(bytes), Map.class);
        assertEquals(1, restored.get("a"));
    }

    @Test
    void toJson_shouldHandleNull() {
        assertThrows(RuntimeException.class, () -> JsonUtils.toJson(new Object()));
    }

    @Test
    void fromJson_shouldThrowOnInvalid() {
        assertThrows(RuntimeException.class, () -> JsonUtils.fromJson("invalid json", String.class));
    }
}
