package com.projectalpha.repository;

import com.projectalpha.domain.Tag;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 标签仓库接口
 * 用于标签的数据库操作
 */
public interface TagRepository extends JpaRepository<Tag, Long> {

    /**
     * 根据名称查找标签
     * @param name 标签名称
     * @return 标签对象，若不存在则返回Optional.empty()
     */
    Optional<Tag> findByName(String name);
}
