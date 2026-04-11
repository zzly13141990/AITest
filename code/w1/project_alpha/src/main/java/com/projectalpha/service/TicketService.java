package com.projectalpha.service;

import com.projectalpha.domain.Tag;
import com.projectalpha.domain.Ticket;
import com.projectalpha.repository.TagRepository;
import com.projectalpha.repository.TicketRepository;
import com.projectalpha.web.dto.AddTagToTicketRequest;
import com.projectalpha.web.dto.TicketCreateRequest;
import com.projectalpha.web.dto.TicketResponse;
import com.projectalpha.web.dto.TicketUpdateRequest;
import com.projectalpha.web.error.ResourceNotFoundException;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ticket服务类
 * 处理Ticket的业务逻辑
 */
@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TagRepository tagRepository;

    /**
     * 构造方法
     * @param ticketRepository Ticket仓库
     * @param tagRepository 标签仓库
     */
    public TicketService(TicketRepository ticketRepository, TagRepository tagRepository) {
        this.ticketRepository = ticketRepository;
        this.tagRepository = tagRepository;
    }

    /**
     * 列表筛选：多标签为 <strong>AND</strong>（必须同时具备所选全部标签）；标题关键字模糊匹配；可与规格 4.2 对照。
     * @param tagIds 标签ID列表
     * @param q 标题关键字
     * @param completed 完成状态
     * @param page 页码（0-based）
     * @param size 每页记录数
     * @param sort 排序参数，格式：字段名,方向，例如：title,asc
     * @return 分页的Ticket列表
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<TicketResponse> listTickets(List<Long> tagIds, String q, Boolean completed, int page, int size, String sort) {
        String normalizedQ = q == null ? "" : q.trim();
        List<Long> distinctTags = 
                tagIds == null ? List.of() : tagIds.stream().filter(Objects::nonNull).distinct().toList();

        // 处理排序参数
        org.springframework.data.domain.PageRequest pageRequest;
        if (sort != null && !sort.isEmpty()) {
            String[] sortParts = sort.split(",");
            String sortField = sortParts[0];
            org.springframework.data.domain.Sort.Direction sortDirection = org.springframework.data.domain.Sort.Direction.ASC;
            if (sortParts.length > 1 && "desc".equalsIgnoreCase(sortParts[1])) {
                sortDirection = org.springframework.data.domain.Sort.Direction.DESC;
            }
            pageRequest = org.springframework.data.domain.PageRequest.of(page, size, sortDirection, sortField);
        } else {
            pageRequest = org.springframework.data.domain.PageRequest.of(page, size);
        }

        org.springframework.data.domain.Page<Ticket> rows;
        if (distinctTags.isEmpty()) {
            rows = ticketRepository.findWithTagsForListByTitleOnly(normalizedQ, completed, pageRequest);
        } else {
            rows = ticketRepository.findWithTagsForListAndTagFilter(normalizedQ, completed, distinctTags, distinctTags.size(), pageRequest);
        }
        return rows.map(TicketResponse::from);
    }

    /**
     * 根据ID获取Ticket
     * @param id Ticket ID
     * @return Ticket对象
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional(readOnly = true)
    public TicketResponse getById(Long id) {
        return TicketResponse.from(ticketRepository
                .findWithTagsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在")));
    }

    /**
     * 创建Ticket
     * @param request Ticket创建请求
     * @return 创建的Ticket
     */
    @Transactional
    public TicketResponse create(TicketCreateRequest request) {
        Ticket t = new Ticket();
        t.setTitle(request.title().trim());
        t.setDescription(request.description());
        t.setCompleted(false);
        t = ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(t.getId()).orElseThrow());
    }

    /**
     * 更新Ticket
     * @param id Ticket ID
     * @param request Ticket更新请求
     * @return 更新后的Ticket
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional
    public TicketResponse update(Long id, TicketUpdateRequest request) {
        Ticket t = ticketRepository
                .findWithTagsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在"));
        t.setTitle(request.title().trim());
        t.setDescription(request.description());
        t.setCompleted(request.completed());
        ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(id).orElseThrow());
    }

    /**
     * 删除Ticket
     * @param id Ticket ID
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional
    public void deleteById(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ticket 不存在");
        }
        ticketRepository.deleteById(id);
    }

    /**
     * 标记Ticket为已完成
     * @param id Ticket ID
     * @return 更新后的Ticket
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional
    public TicketResponse complete(Long id) {
        Ticket t = ticketRepository
                .findWithTagsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在"));
        t.setCompleted(true);
        ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(id).orElseThrow());
    }

    /**
     * 标记Ticket为未完成
     * @param id Ticket ID
     * @return 更新后的Ticket
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional
    public TicketResponse incomplete(Long id) {
        Ticket t = ticketRepository
                .findWithTagsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在"));
        t.setCompleted(false);
        ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(id).orElseThrow());
    }

    /**
     * 为Ticket添加标签
     * @param ticketId Ticket ID
     * @param request 添加标签请求
     * @return 更新后的Ticket
     * @throws ResourceNotFoundException Ticket或Tag不存在时抛出
     * @throws IllegalArgumentException 参数无效时抛出
     */
    @Transactional
    public TicketResponse addTag(Long ticketId, AddTagToTicketRequest request) {
        boolean hasId = request.tagId() != null;
        boolean hasName = request.tagName() != null && !request.tagName().isBlank();
        if (hasId == hasName) {
            throw new IllegalArgumentException("请提供 tagId 或 tagName 之一");
        }

        Ticket t = ticketRepository
                .findWithTagsById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在"));

        Tag tag;
        if (hasId) {
            tag = tagRepository
                    .findById(request.tagId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tag 不存在"));
        } else {
            String name = request.tagName().trim();
            tag = tagRepository
                    .findByName(name)
                    .orElseGet(() -> {
                        Tag nt = new Tag();
                        nt.setName(name);
                        return tagRepository.save(nt);
                    });
        }

        t.getTags().add(tag);
        ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(ticketId).orElseThrow());
    }

    /**
     * 从Ticket移除标签
     * @param ticketId Ticket ID
     * @param tagId 标签ID
     * @return 更新后的Ticket
     * @throws ResourceNotFoundException Ticket不存在时抛出
     */
    @Transactional
    public TicketResponse removeTag(Long ticketId, Long tagId) {
        Ticket t = ticketRepository
                .findWithTagsById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket 不存在"));
        t.getTags().removeIf(tag -> tag.getId().equals(tagId));
        ticketRepository.save(t);
        return TicketResponse.from(
                ticketRepository.findWithTagsById(ticketId).orElseThrow());
    }
}
