package com.projectalpha.service;

import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.entity.Metadata;
import com.projectalpha.repository.MetadataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LlmService {
    private final MetadataRepository metadataRepository;
    
    @Value("${openai.api-key}")
    private String openaiApiKey;
    
    @Value("${openai.model}")
    private String openaiModel;
    
    public LlmService(MetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }
    
    public String generateSql(long connectionId, String naturalLanguageQuery) {
        // 获取数据库元数据
        List<MetadataDTO> metadataList = metadataRepository.findByConnectionId(connectionId).stream()
                .map(metadata -> {
                    MetadataDTO dto = new MetadataDTO();
                    dto.setTableName(metadata.getTableName());
                    dto.setTableType(metadata.getTableType());
                    dto.setColumns(metadata.getColumns());
                    return dto;
                })
                .collect(Collectors.toList());
        
        // 构建prompt
        String prompt = buildPrompt(naturalLanguageQuery, metadataList);
        
        // 调用OpenAI API生成SQL
        // 注意：这里需要集成OpenAI SDK，由于依赖可能未完全配置，暂时返回示例SQL
        // 实际实现时需要使用OpenAI SDK调用API
        
        return "SELECT * FROM example_table LIMIT 1000"; // 示例返回
    }
    
    private String buildPrompt(String naturalLanguageQuery, List<MetadataDTO> metadataList) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a SQL SELECT statement based on the following natural language query:");
        prompt.append("\n\n");
        prompt.append(naturalLanguageQuery);
        prompt.append("\n\n");
        prompt.append("Database schema information:");
        prompt.append("\n\n");
        
        for (MetadataDTO metadata : metadataList) {
            prompt.append("Table/View: ").append(metadata.getTableName()).append(" (").append(metadata.getTableType()).append(")");
            prompt.append("\n");
            prompt.append("Columns: ").append(metadata.getColumns());
            prompt.append("\n\n");
        }
        
        prompt.append("Please generate only the SQL statement, no explanations.");
        prompt.append("Make sure the SQL is syntactically correct and uses the appropriate table and column names.");
        
        return prompt.toString();
    }
}