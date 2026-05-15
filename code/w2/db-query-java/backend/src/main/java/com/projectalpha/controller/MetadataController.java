package com.projectalpha.controller;

import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.service.MetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<MetadataDTO>> getMetadataByConnectionId(@PathVariable Long connectionId, 
                                                                   @RequestParam(defaultValue = "1") int page, 
                                                                   @RequestParam(defaultValue = "100") int pageSize) {
        List<MetadataDTO> metadataList = metadataService.getMetadataByConnectionId(connectionId, page, pageSize);
        return ResponseEntity.ok(metadataList);
    }
    
    @GetMapping("/count/{connectionId}")
    public ResponseEntity<Map<String, Integer>> getMetadataCount(@PathVariable Long connectionId) {
        Map<String, Integer> countMap = metadataService.getMetadataCount(connectionId);
        return ResponseEntity.ok(countMap);
    }
    
    @GetMapping("/tables/{connectionId}")
    public ResponseEntity<List<String>> getTables(@PathVariable Long connectionId, 
                                               @RequestParam(defaultValue = "1") int page, 
                                               @RequestParam(defaultValue = "50") int pageSize) {
        List<String> tables = metadataService.getTables(connectionId, page, pageSize);
        return ResponseEntity.ok(tables);
    }
    
    @GetMapping("/views/{connectionId}")
    public ResponseEntity<List<String>> getViews(@PathVariable Long connectionId, 
                                               @RequestParam(defaultValue = "1") int page, 
                                               @RequestParam(defaultValue = "50") int pageSize) {
        List<String> views = metadataService.getViews(connectionId, page, pageSize);
        return ResponseEntity.ok(views);
    }
    
    @GetMapping("/procedures/{connectionId}")
    public ResponseEntity<List<String>> getProcedures(@PathVariable Long connectionId, 
                                                   @RequestParam(defaultValue = "1") int page, 
                                                   @RequestParam(defaultValue = "50") int pageSize) {
        List<String> procedures = metadataService.getProcedures(connectionId, page, pageSize);
        return ResponseEntity.ok(procedures);
    }
    
    @GetMapping("/functions/{connectionId}")
    public ResponseEntity<List<String>> getFunctions(@PathVariable Long connectionId, 
                                                  @RequestParam(defaultValue = "1") int page, 
                                                  @RequestParam(defaultValue = "50") int pageSize) {
        List<String> functions = metadataService.getFunctions(connectionId, page, pageSize);
        return ResponseEntity.ok(functions);
    }
    
    @GetMapping("/triggers/{connectionId}")
    public ResponseEntity<List<String>> getTriggers(@PathVariable Long connectionId, 
                                                 @RequestParam(defaultValue = "1") int page, 
                                                 @RequestParam(defaultValue = "50") int pageSize) {
        List<String> triggers = metadataService.getTriggers(connectionId, page, pageSize);
        return ResponseEntity.ok(triggers);
    }
    
    @GetMapping("/view/{connectionId}/{viewName}")
    public ResponseEntity<Map<String, String>> getViewDetails(@PathVariable Long connectionId, @PathVariable String viewName) {
        Map<String, String> viewDetails = metadataService.getViewDetails(connectionId, viewName);
        return ResponseEntity.ok(viewDetails);
    }
    
    @GetMapping("/procedure/{connectionId}/{procedureName}")
    public ResponseEntity<Map<String, String>> getProcedureDetails(@PathVariable Long connectionId, @PathVariable String procedureName) {
        Map<String, String> procedureDetails = metadataService.getProcedureDetails(connectionId, procedureName);
        return ResponseEntity.ok(procedureDetails);
    }
    
    @GetMapping("/function/{connectionId}/{functionName}")
    public ResponseEntity<Map<String, String>> getFunctionDetails(@PathVariable Long connectionId, @PathVariable String functionName) {
        Map<String, String> functionDetails = metadataService.getFunctionDetails(connectionId, functionName);
        return ResponseEntity.ok(functionDetails);
    }
    
    @GetMapping("/trigger/{connectionId}/{triggerName}")
    public ResponseEntity<Map<String, String>> getTriggerDetails(@PathVariable Long connectionId, @PathVariable String triggerName) {
        Map<String, String> triggerDetails = metadataService.getTriggerDetails(connectionId, triggerName);
        return ResponseEntity.ok(triggerDetails);
    }
    
    @GetMapping("/search/{connectionId}")
    public ResponseEntity<Map<String, List<String>>> searchObjects(@PathVariable Long connectionId, @RequestParam String keyword) {
        Map<String, List<String>> searchResults = metadataService.searchObjects(connectionId, keyword);
        return ResponseEntity.ok(searchResults);
    }
}