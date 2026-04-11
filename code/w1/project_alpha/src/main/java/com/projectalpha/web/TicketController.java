package com.projectalpha.web;

import com.projectalpha.service.TicketService;
import com.projectalpha.web.dto.AddTagToTicketRequest;
import com.projectalpha.web.dto.TicketCreateRequest;
import com.projectalpha.web.dto.TicketResponse;
import com.projectalpha.web.dto.TicketUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ticket控制器
 * 处理Ticket相关的HTTP请求
 */
@RestController
@RequestMapping("/api/tickets")
@Tag(name = "tickets", description = "Ticket 的增删改查与完成状态")
public class TicketController {

    private final TicketService ticketService;

    /**
     * 构造方法
     * @param ticketService Ticket服务
     */
    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    /**
     * 获取 Ticket 列表
     * 支持 tagIds 多值（AND 语义）、标题关键字 q、状态筛选 completed 与分页
     * 示例：?tagIds=1&tagIds=2&q=登录&completed=true&page=0&size=10
     * @param tagIds 标签 ID，可重复传参
     * @param q 标题模糊搜索
     * @param completed 状态筛选
     * @param page 页码，从0开始
     * @param size 每页大小
     * @return 分页的Ticket列表
     */
    @GetMapping
    @Operation(summary = "获取 Ticket 列表", description = "支持 tagIds 多值（AND 语义）、标题关键字 q、状态筛选 completed 与分页；示例：?tagIds=1&tagIds=2&q=登录&completed=true&page=0&size=10&sort=title,asc")
    public org.springframework.data.domain.Page<TicketResponse> list(
            @Parameter(description = "标签 ID，可重复传参") @RequestParam(required = false) List<Long> tagIds,
            @Parameter(description = "标题模糊搜索") @RequestParam(required = false) String q,
            @Parameter(description = "状态筛选") @RequestParam(required = false) Boolean completed,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "排序参数，格式：字段名,方向，例如：title,asc") @RequestParam(required = false) String sort) {
        return ticketService.listTickets(tagIds, q, completed, page, size, sort);
    }

    /**
     * 获取 Ticket 详情
     * @param id Ticket ID
     * @return Ticket详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取 Ticket 详情")
    public TicketResponse get(@PathVariable Long id) {
        return ticketService.getById(id);
    }

    /**
     * 创建 Ticket
     * @param body Ticket创建请求
     * @return 创建的Ticket
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "创建 Ticket")
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody TicketCreateRequest body) {
        TicketResponse created = ticketService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/tickets/" + created.id()))
                .body(created);
    }

    /**
     * 更新 Ticket
     * @param id Ticket ID
     * @param body Ticket更新请求
     * @return 更新后的Ticket
     */
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "更新 Ticket")
    public TicketResponse update(@PathVariable Long id, @Valid @RequestBody TicketUpdateRequest body) {
        return ticketService.update(id, body);
    }

    /**
     * 删除 Ticket
     * @param id Ticket ID
     * @return 无内容响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除 Ticket")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ticketService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 标记为已完成
     * @param id Ticket ID
     * @return 更新后的Ticket
     */
    @PatchMapping("/{id}/complete")
    @Operation(summary = "标记为已完成")
    public TicketResponse complete(@PathVariable Long id) {
        return ticketService.complete(id);
    }

    /**
     * 取消完成
     * @param id Ticket ID
     * @return 更新后的Ticket
     */
    @PatchMapping("/{id}/incomplete")
    @Operation(summary = "取消完成")
    public TicketResponse incomplete(@PathVariable Long id) {
        return ticketService.incomplete(id);
    }

    /**
     * 为 Ticket 添加标签
     * Body 提供 tagId 或 tagName 之一；按名不存在时自动创建标签
     * @param id Ticket ID
     * @param body 添加标签请求
     * @return 更新后的Ticket
     */
    @PostMapping(path = "/{id}/tags", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "为 Ticket 添加标签", description = "Body 提供 tagId 或 tagName 之一；按名不存在时自动创建标签")
    public TicketResponse addTag(@PathVariable Long id, @RequestBody AddTagToTicketRequest body) {
        return ticketService.addTag(id, body);
    }

    /**
     * 从 Ticket 移除标签
     * @param id Ticket ID
     * @param tagId 标签ID
     * @return 更新后的Ticket
     */
    @DeleteMapping("/{id}/tags/{tagId}")
    @Operation(summary = "从 Ticket 移除标签")
    public TicketResponse removeTag(@PathVariable Long id, @PathVariable Long tagId) {
        return ticketService.removeTag(id, tagId);
    }
}
