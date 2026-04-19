package com.projectalpha.controller;

import com.projectalpha.dto.ConnectionDTO;
import com.projectalpha.service.ConnectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "*")
public class ConnectionController {
    private final ConnectionService connectionService;
    
    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }
    
    @PostMapping
    public ResponseEntity<ConnectionDTO> createConnection(@RequestBody ConnectionDTO connectionDTO) {
        ConnectionDTO createdConnection = connectionService.createConnection(connectionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdConnection);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ConnectionDTO> updateConnection(@PathVariable Long id, @RequestBody ConnectionDTO connectionDTO) {
        ConnectionDTO updatedConnection = connectionService.updateConnection(id, connectionDTO);
        return ResponseEntity.ok(updatedConnection);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConnection(@PathVariable Long id) {
        connectionService.deleteConnection(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ConnectionDTO> getConnection(@PathVariable Long id) {
        ConnectionDTO connectionDTO = connectionService.getConnection(id);
        return ResponseEntity.ok(connectionDTO);
    }
    
    @GetMapping
    public ResponseEntity<List<ConnectionDTO>> getAllConnections() {
        List<ConnectionDTO> connections = connectionService.getAllConnections();
        return ResponseEntity.ok(connections);
    }
    
    @PostMapping("/test")
    public ResponseEntity<Boolean> testConnection(@RequestBody ConnectionDTO connectionDTO) {
        boolean isConnected = connectionService.testConnection(connectionDTO);
        return ResponseEntity.ok(isConnected);
    }
}