package com.projectalpha.repository;

import com.projectalpha.domain.Ticket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Ticket仓库接口
 * 用于Ticket的数据库操作
 */
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    /**
     * 列表：按标题过滤；未完成优先，再按更新时间倒序（与 0001-spec 3.3 一致）。
     * 标签筛选在 {@link #findWithTagsForListAndTagFilter}。
     * @param q 标题关键字
     * @param completed 完成状态
     * @param pageable 分页参数
     * @return 分页的Ticket列表
     */
    @Query(
            """
            SELECT DISTINCT t FROM Ticket t LEFT JOIN FETCH t.tags
            WHERE (COALESCE(:q, '') = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:completed IS NULL OR t.completed = :completed)
            ORDER BY t.completed ASC, t.updatedAt DESC
            """)
    org.springframework.data.domain.Page<Ticket> findWithTagsForListByTitleOnly(@Param("q") String q, @Param("completed") Boolean completed, org.springframework.data.domain.Pageable pageable);

    /**
     * 多标签 **AND**：Ticket 必须同时拥有 tagIds 中的全部标签；可与标题关键字组合。
     * @param q 标题关键字
     * @param completed 完成状态
     * @param tagIds 标签ID列表
     * @param tagCount 标签数量
     * @param pageable 分页参数
     * @return 分页的Ticket列表
     */
    @Query(
            """
            SELECT DISTINCT t FROM Ticket t LEFT JOIN FETCH t.tags
            WHERE (COALESCE(:q, '') = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:completed IS NULL OR t.completed = :completed)
            AND (SELECT COUNT(tg.id) FROM Ticket ti JOIN ti.tags tg WHERE ti.id = t.id AND tg.id IN :tagIds) = :tagCount
            ORDER BY t.completed ASC, t.updatedAt DESC
            """)
    org.springframework.data.domain.Page<Ticket> findWithTagsForListAndTagFilter(
            @Param("q") String q, @Param("completed") Boolean completed, @Param("tagIds") List<Long> tagIds, @Param("tagCount") int tagCount, org.springframework.data.domain.Pageable pageable);

    /**
     * 根据ID查找Ticket，并加载关联的标签
     * @param id Ticket ID
     * @return Ticket对象，若不存在则返回Optional.empty()
     */
    @Query("SELECT DISTINCT t FROM Ticket t LEFT JOIN FETCH t.tags WHERE t.id = :id")
    Optional<Ticket> findWithTagsById(@Param("id") Long id);
}
