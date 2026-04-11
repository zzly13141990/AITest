package com.projectalpha.web;

import com.projectalpha.service.TagService;
import com.projectalpha.web.dto.TagCreateRequest;
import com.projectalpha.web.dto.TagResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 标签控制器
 * 处理标签相关的HTTP请求
 */
@RestController
@RequestMapping("/api/tags")
@Tag(name = "tags", description = "标签及与 Ticket 的关联")
public class TagController {

    private final TagService tagService;

    /**
     * 构造方法
     * @param tagService 标签服务
     */
    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    /**
     * 获取全部标签
     * @return 标签列表
     */
    @GetMapping
    @Operation(summary = "获取全部标签")
    public List<TagResponse> list() {
        return tagService.findAll();
    }

    /**
     * 新建标签
     * @param body 标签创建请求
     * @return 创建的标签
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "新建标签")
    public ResponseEntity<TagResponse> create(@Valid @RequestBody TagCreateRequest body) {
        TagResponse created = tagService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
