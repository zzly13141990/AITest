package com.projectalpha.service;

import com.projectalpha.dto.ConnectionDTO;
import com.projectalpha.entity.Connection;
import com.projectalpha.repository.ConnectionRepository;
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

class ConnectionServiceTest {
    
    @Mock
    private ConnectionRepository connectionRepository;
    
    @InjectMocks
    private ConnectionService connectionService;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    void testCreateConnection() {
        ConnectionDTO connectionDTO = new ConnectionDTO();
        connectionDTO.setConnectionName("Test Connection");
        connectionDTO.setHost("localhost");
        connectionDTO.setPort(3306);
        connectionDTO.setDatabaseName("test_db");
        connectionDTO.setUsername("root");
        connectionDTO.setPassword("password");
        connectionDTO.setDatabaseType("mysql");
        
        Connection connection = new Connection();
        connection.setId(1L);
        connection.setConnectionName("Test Connection");
        connection.setHost("localhost");
        connection.setPort(3306);
        connection.setDatabaseName("test_db");
        connection.setUsername("root");
        connection.setPassword("password");
        connection.setDatabaseType("mysql");
        
        when(connectionRepository.save(any(Connection.class))).thenReturn(connection);
        
        ConnectionDTO result = connectionService.createConnection(connectionDTO);
        
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Connection", result.getConnectionName());
    }
    
    @Test
    void testGetAllConnections() {
        List<Connection> connections = new ArrayList<>();
        Connection connection1 = new Connection();
        connection1.setId(1L);
        connection1.setConnectionName("Connection 1");
        connections.add(connection1);
        
        Connection connection2 = new Connection();
        connection2.setId(2L);
        connection2.setConnectionName("Connection 2");
        connections.add(connection2);
        
        when(connectionRepository.findAll()).thenReturn(connections);
        
        List<ConnectionDTO> result = connectionService.getAllConnections();
        
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Connection 1", result.get(0).getConnectionName());
        assertEquals("Connection 2", result.get(1).getConnectionName());
    }
    
    @Test
    void testGetConnection() {
        Connection connection = new Connection();
        connection.setId(1L);
        connection.setConnectionName("Test Connection");
        
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(connection));
        
        ConnectionDTO result = connectionService.getConnection(1L);
        
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Connection", result.getConnectionName());
    }
    
    @Test
    void testUpdateConnection() {
        Connection existingConnection = new Connection();
        existingConnection.setId(1L);
        existingConnection.setConnectionName("Old Name");
        
        ConnectionDTO connectionDTO = new ConnectionDTO();
        connectionDTO.setConnectionName("New Name");
        connectionDTO.setHost("localhost");
        connectionDTO.setPort(3306);
        connectionDTO.setDatabaseName("test_db");
        connectionDTO.setUsername("root");
        connectionDTO.setPassword("password");
        connectionDTO.setDatabaseType("mysql");
        
        Connection updatedConnection = new Connection();
        updatedConnection.setId(1L);
        updatedConnection.setConnectionName("New Name");
        updatedConnection.setHost("localhost");
        updatedConnection.setPort(3306);
        updatedConnection.setDatabaseName("test_db");
        updatedConnection.setUsername("root");
        updatedConnection.setPassword("password");
        updatedConnection.setDatabaseType("mysql");
        
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(existingConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(updatedConnection);
        
        ConnectionDTO result = connectionService.updateConnection(1L, connectionDTO);
        
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("New Name", result.getConnectionName());
    }
    
    @Test
    void testDeleteConnection() {
        doNothing().when(connectionRepository).deleteById(1L);
        
        connectionService.deleteConnection(1L);
        
        verify(connectionRepository, times(1)).deleteById(1L);
    }
    
    @Test
    void testTestConnection() {
        ConnectionDTO connectionDTO = new ConnectionDTO();
        connectionDTO.setHost("localhost");
        connectionDTO.setPort(3306);
        connectionDTO.setDatabaseName("test_db");
        connectionDTO.setUsername("root");
        connectionDTO.setPassword("password");
        connectionDTO.setDatabaseType("mysql");
        
        // 由于测试环境可能没有真实的数据库连接，这里测试会返回false
        boolean result = connectionService.testConnection(connectionDTO);
        assertFalse(result);
    }
}
