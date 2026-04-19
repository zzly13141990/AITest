package com.projectalpha.service;

import com.projectalpha.dto.MetadataDTO;
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
    }
    
    @Test
    void testGenerateSql() {
        List<Metadata> metadataList = new ArrayList<>();
        Metadata metadata1 = new Metadata();
        metadata1.setId(1L);
        metadata1.setTableName("users");
        metadata1.setTableType("TABLE");
        metadata1.setColumns("[{\"columnName\": \"id\", \"dataType\": \"INT\"}, {\"columnName\": \"name\", \"dataType\": \"VARCHAR\"}]");
        metadataList.add(metadata1);
        
        when(metadataRepository.findByConnectionId(1L)).thenReturn(metadataList);
        
        String result = llmService.generateSql(1L, "Get all users");
        
        assertNotNull(result);
        assertTrue(result.contains("SELECT"));
        assertTrue(result.contains("FROM"));
    }
}
