package com.projectalpha.service;

import com.projectalpha.dto.ConnectionDTO;
import com.projectalpha.entity.Connection;
import com.projectalpha.exception.ConnectionNotFoundException;
import com.projectalpha.exception.DatabaseException;
import com.projectalpha.repository.ConnectionRepository;
import com.projectalpha.util.DatabaseConnectionUtil;
import com.projectalpha.util.DatabaseErrorUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ConnectionService {
    private static final Logger logger = LoggerFactory.getLogger(ConnectionService.class);

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
                .orElseThrow(() -> new ConnectionNotFoundException(id));

        updateConnectionFields(existingConnection, connectionDTO);
        Connection updatedConnection = connectionRepository.save(existingConnection);
        return mapToDTO(updatedConnection);
    }

    @Transactional
    public void deleteConnection(Long id) {
        connectionRepository.deleteById(id);
    }

    public ConnectionDTO getConnection(Long id) {
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
        return mapToDTO(connection);
    }

    public List<ConnectionDTO> getAllConnections() {
        return connectionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public boolean testConnection(ConnectionDTO connectionDTO) {
        String url = DatabaseConnectionUtil.buildJdbcUrl(mapToEntity(connectionDTO));

        try (java.sql.Connection conn = DriverManager.getConnection(
                    url,
                    connectionDTO.getUsername(),
                    connectionDTO.getPassword())) {
            // Test query
            try (var testStmt = conn.createStatement()) {
                testStmt.execute("SELECT 1");
            }
            logger.info("Connection test successful for: {}", connectionDTO.getConnectionName());
            return true;
        } catch (SQLException e) {
            logConnectionError(connectionDTO.getConnectionName(), url, e);
            return false;
        }
    }

    private void updateConnectionFields(Connection connection, ConnectionDTO dto) {
        if (dto.getConnectionName() != null) {
            connection.setConnectionName(dto.getConnectionName());
        }
        if (dto.getHost() != null) {
            connection.setHost(dto.getHost());
        }
        if (dto.getPort() != null) {
            connection.setPort(dto.getPort());
        }
        if (dto.getDatabaseName() != null) {
            connection.setDatabaseName(dto.getDatabaseName());
        }
        if (dto.getUsername() != null) {
            connection.setUsername(dto.getUsername());
        }
        if (dto.getPassword() != null) {
            connection.setPassword(dto.getPassword());
        }
        if (dto.getDatabaseType() != null) {
            connection.setDatabaseType(dto.getDatabaseType());
        }
    }

    private void logConnectionError(String connectionName, String url, SQLException e) {
        logger.error("Connection test failed for '{}' using URL: {}", connectionName, url);
        logger.error("SQL State: {}, Error Code: {}, Message: {}", e.getSQLState(), e.getErrorCode(), e.getMessage());
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
