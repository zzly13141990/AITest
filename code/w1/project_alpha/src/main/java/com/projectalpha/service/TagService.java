package com.projectalpha.service;

import com.projectalpha.domain.Tag;
import com.projectalpha.repository.TagRepository;
import com.projectalpha.web.dto.TagCreateRequest;
import com.projectalpha.web.dto.TagResponse;
import com.projectalpha.web.error.ConflictException;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 标签服务类
 * 处理标签的业务逻辑
 */
@Service
public class TagService {

    private final TagRepository tagRepository;

    /**
     * 构造方法
     * @param tagRepository 标签仓库
     */
    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    /**
     * 查询所有标签
     * @return 标签列表
     */
    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagRepository.findAll().stream()
                .map(TagResponse::from)
                .sorted(Comparator.comparing(TagResponse::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /**
     * 创建标签
     * @param request 标签创建请求
     * @return 创建的标签
     * @throws ConflictException 标签名称已存在时抛出
     */
    @Transactional
    public TagResponse create(TagCreateRequest request) {
        String name = request.name().trim();
        if (tagRepository.findByName(name).isPresent()) {
            throw new ConflictException("标签名称已存在");
        }
        Tag tag = new Tag();
        tag.setName(name);
        return TagResponse.from(tagRepository.save(tag));
    }
}
