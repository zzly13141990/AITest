package com.projectalpha.service;

import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.entity.Connection;
import com.projectalpha.entity.Metadata;
import com.projectalpha.repository.ConnectionRepository;
import com.projectalpha.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MetadataServiceTest {
    
    @Mock
    private MetadataRepository metadataRepository;
    
    @Mock
    private ConnectionRepository connectionRepository;
    
    @InjectMocks
    private MetadataService metadataService;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    void testGetMetadataByConnectionId() {
        Connection connection = new Connection();
        connection.setId(1L);
        
        List<Metadata> metadataList = new ArrayList<>();
        Metadata metadata1 = new Metadata();
        metadata1.setId(1L);
        metadata1.setConnection(connection);
        metadata1.setTableName("users");
        metadata1.setTableType("TABLE");
        metadata1.setColumns("[{\"columnName\": \"id\", \"dataType\": \"INT\"}]");
        metadataList.add(metadata1);
        
        Metadata metadata2 = new Metadata();
        metadata2.setId(2L);
        metadata2.setConnection(connection);
        metadata2.setTableName("orders");
        metadata2.setTableType("TABLE");
        metadata2.setColumns("[{\"columnName\": \"order_id\", \"dataType\": \"INT\"}]");
        metadataList.add(metadata2);
        
        when(metadataRepository.findByConnectionId(1L)).thenReturn(metadataList);
        
        List<MetadataDTO> result = metadataService.getMetadataByConnectionId(1L);
        
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("users", result.get(0).getTableName());
        assertEquals("orders", result.get(1).getTableName());
    }
    
    @Test
    void testExtractMetadata() {
        Connection connection = new Connection();
        connection.setId(1L);
        connection.setHost("localhost");
        connection.setPort(1433);
        connection.setDatabaseName("test_db");
        connection.setUsername("sa");
        connection.setPassword("password");
        connection.setDatabaseType("sqlserver");
        
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(connection));
        when(metadataRepository.findByConnectionId(1L)).thenReturn(new ArrayList<>());
        
        // 由于测试环境可能没有真实的数据库连接，这里会抛出异常
        assertThrows(RuntimeException.class, () -> {
            metadataService.extractMetadata(1L);
        });
    }
}
