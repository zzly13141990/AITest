package com.projectalpha.service;

import com.projectalpha.dto.ConnectionDTO;
import com.projectalpha.entity.Connection;
import com.projectalpha.repository.ConnectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConnectionService {
    private final ConnectionRepository connectionRepository;
    
    public ConnectionService(ConnectionRepository connectionRepository) {
        this.connectionRepository = connectionRepository;
    }
    
    @Transactional
    public ConnectionDTO createConnection(ConnectionDTO connectionDTO) {
        Connection connection = mapToEntity(connectionDTO);
        Connection savedConnection = connectionRepository.save(connection);
        return mapToDTO(savedConnection);
    }
    
    @Transactional
    public ConnectionDTO updateConnection(Long id, ConnectionDTO connectionDTO) {
        Connection existingConnection = connectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
        
        existingConnection.setConnectionName(connectionDTO.getConnectionName());
        existingConnection.setHost(connectionDTO.getHost());
        existingConnection.setPort(connectionDTO.getPort());
        existingConnection.setDatabaseName(connectionDTO.getDatabaseName());
        existingConnection.setUsername(connectionDTO.getUsername());
        existingConnection.setPassword(connectionDTO.getPassword());
        existingConnection.setDatabaseType(connectionDTO.getDatabaseType());
        
        Connection updatedConnection = connectionRepository.save(existingConnection);
        return mapToDTO(updatedConnection);
    }
    
    @Transactional
    public void deleteConnection(Long id) {
        connectionRepository.deleteById(id);
    }
    
    public ConnectionDTO getConnection(Long id) {
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
        return mapToDTO(connection);
    }
    
    public List<ConnectionDTO> getAllConnections() {
        return connectionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    public boolean testConnection(ConnectionDTO connectionDTO) {
        String url = getConnectionUrl(connectionDTO);
        try (java.sql.Connection conn = DriverManager.getConnection(
                url, 
                connectionDTO.getUsername(), 
                connectionDTO.getPassword())) {
            return true;
        } catch (SQLException e) {
            return false;
        }
    }
    
    private String getConnectionUrl(ConnectionDTO connectionDTO) {
        switch (connectionDTO.getDatabaseType().toLowerCase()) {
            case "mysql":
                return "jdbc:mysql://" + connectionDTO.getHost() + ":" + connectionDTO.getPort() + "/" + connectionDTO.getDatabaseName() + "?useSSL=false&serverTimezone=UTC";
            case "postgresql":
                return "jdbc:postgresql://" + connectionDTO.getHost() + ":" + connectionDTO.getPort() + "/" + connectionDTO.getDatabaseName() + "?sslmode=disable";
            case "sqlserver":
                return "jdbc:sqlserver://" + connectionDTO.getHost() + ":" + connectionDTO.getPort() + ";databaseName=" + connectionDTO.getDatabaseName() + ";encrypt=false;trustServerCertificate=true";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + connectionDTO.getDatabaseType());
        }
    }
    
    private Connection mapToEntity(ConnectionDTO connectionDTO) {
        Connection connection = new Connection();
        connection.setConnectionName(connectionDTO.getConnectionName());
        connection.setHost(connectionDTO.getHost());
        connection.setPort(connectionDTO.getPort());
        connection.setDatabaseName(connectionDTO.getDatabaseName());
        connection.setUsername(connectionDTO.getUsername());
        connection.setPassword(connectionDTO.getPassword());
        connection.setDatabaseType(connectionDTO.getDatabaseType());
        return connection;
    }
    
    private ConnectionDTO mapToDTO(Connection connection) {
        ConnectionDTO connectionDTO = new ConnectionDTO();
        connectionDTO.setId(connection.getId());
        connectionDTO.setConnectionName(connection.getConnectionName());
        connectionDTO.setHost(connection.getHost());
        connectionDTO.setPort(connection.getPort());
        connectionDTO.setDatabaseName(connection.getDatabaseName());
        connectionDTO.setUsername(connection.getUsername());
        connectionDTO.setPassword(connection.getPassword());
        connectionDTO.setDatabaseType(connection.getDatabaseType());
        connectionDTO.setCreatedAt(connection.getCreatedAt());
        connectionDTO.setUpdatedAt(connection.getUpdatedAt());
        return connectionDTO;
    }
}