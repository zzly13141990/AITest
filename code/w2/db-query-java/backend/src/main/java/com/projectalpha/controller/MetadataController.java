package com.projectalpha.controller;

import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.service.MetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metadata")
@CrossOrigin(origins = "*")
public class MetadataController {
    private final MetadataService metadataService;
    
    public MetadataController(MetadataService metadataService) {
        this.metadataService = metadataService;
    }
    
    @PostMapping("/extract/{connectionId}")
    public ResponseEntity<Void> extractMetadata(@PathVariable Long connectionId) {
        metadataService.extractMetadata(connectionId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/connection/{connectionId}")
    public ResponseEntity<List<MetadataDTO>> getMetadataByConnectionId(@PathVariable Long connectionId) {
        List<MetadataDTO> metadataList = metadataService.getMetadataByConnectionId(connectionId);
        return ResponseEntity.ok(metadataList);
    }
}