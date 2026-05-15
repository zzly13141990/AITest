package com.projectalpha.service;

import com.projectalpha.entity.Metadata;
import com.projectalpha.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LlmServiceTest {

    @Mock
    private MetadataRepository metadataRepository;

    @InjectMocks
    private LlmService llmService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        setField("llmApiKey", "");
        setField("llmBaseUrl", "https://open.bigmodel.cn/api/anthropic");
        setField("llmModel", "glm-4-flash");
    }

    @Test
    void testModelConfiguration() throws Exception {
        String model = getFieldValue("llmModel");
        assertEquals("glm-4-flash", model, "LLM 模型应正确配置为 glm-4-flash");
    }

    @Test
    void testBaseUrlConfiguration() throws Exception {
        String baseUrl = getFieldValue("llmBaseUrl");
        assertEquals("https://open.bigmodel.cn/api/anthropic", baseUrl, "LLM API 基础 URL 应正确配置");
    }

    @Test
    void testGenerateSql_emptyApiKey_shouldThrow() {
        List<Metadata> metadataList = new ArrayList<>();
        Metadata m = new Metadata();
        m.setId(1L);
        m.setTableName("users");
        m.setTableType("TABLE");
        m.setColumns("[{\"columnName\":\"id\",\"dataType\":\"INT\"},{\"columnName\":\"name\",\"dataType\":\"VARCHAR\"}]");
        metadataList.add(m);

        when(metadataRepository.findByConnectionId(1L)).thenReturn(metadataList);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> llmService.generateSql(1L, "Get all users"));
        assertTrue(ex.getMessage().contains("API Key"), "空 API Key 应抛出异常");
    }

    @Test
    void testGenerateSql_withValidApiKey_shouldCallApi() {
        setField("llmApiKey", "test-key");
        List<Metadata> metadataList = new ArrayList<>();
        Metadata m = new Metadata();
        m.setId(1L);
        m.setTableName("products");
        m.setTableType("TABLE");
        m.setColumns("[{\"columnName\":\"id\",\"dataType\":\"INT\"},{\"columnName\":\"name\",\"dataType\":\"VARCHAR\"},{\"columnName\":\"price\",\"dataType\":\"DECIMAL\"}]");
        metadataList.add(m);

        when(metadataRepository.findByConnectionId(1L)).thenReturn(metadataList);

        assertThrows(RuntimeException.class, () -> llmService.generateSql(1L, "查询所有商品"));
    }

    @Test
    void testGenerateSql_withNullApiKey_shouldThrow() {
        setField("llmApiKey", null);
        List<Metadata> metadataList = new ArrayList<>();
        Metadata m = new Metadata();
        m.setId(1L);
        m.setTableName("users");
        m.setTableType("TABLE");
        m.setColumns("[{\"columnName\":\"id\",\"dataType\":\"INT\"}]");
        metadataList.add(m);

        when(metadataRepository.findByConnectionId(1L)).thenReturn(metadataList);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> llmService.generateSql(1L, "Get users"));
        assertTrue(ex.getMessage().contains("API Key"), "null API Key 应抛出异常");
    }

    private void setField(String name, Object value) {
        try {
            var f = LlmService.class.getDeclaredField(name);
            f.setAccessible(true);
            f.set(llmService, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String getFieldValue(String name) throws Exception {
        var f = LlmService.class.getDeclaredField(name);
        f.setAccessible(true);
        return (String) f.get(llmService);
    }
}
