package com.projectalpha.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Ticket实体类
 * 用于表示待办事项信息
 */
@Entity
@Table(name = "ticket")
public class Ticket {

    /**
     * Ticket ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 标题
     */
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    /**
     * 描述
     */
    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /**
     * 完成状态
     */
    @Column(name = "completed", nullable = false)
    private boolean completed;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "datetime2")
    private Instant createdAt;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "datetime2")
    private Instant updatedAt;

    /**
     * 拥有方：仅维护关联表，不对 Tag 做 REMOVE 级联，避免删除 Ticket 时误删全局标签实体。
     */
    @ManyToMany
    @JoinTable(
            name = "ticket_tag",
            joinColumns = @JoinColumn(name = "ticket_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    /**
     * 默认构造方法
     */
    public Ticket() {
    }

    /**
     * 获取Ticket ID
     * @return Ticket ID
     */
    public Long getId() {
        return id;
    }

    /**
     * 设置Ticket ID
     * @param id Ticket ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * 获取标题
     * @return 标题
     */
    public String getTitle() {
        return title;
    }

    /**
     * 设置标题
     * @param title 标题
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * 获取描述
     * @return 描述
     */
    public String getDescription() {
        return description;
    }

    /**
     * 设置描述
     * @param description 描述
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * 获取完成状态
     * @return 完成状态
     */
    public boolean isCompleted() {
        return completed;
    }

    /**
     * 设置完成状态
     * @param completed 完成状态
     */
    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    /**
     * 获取创建时间
     * @return 创建时间
     */
    public Instant getCreatedAt() {
        return createdAt;
    }

    /**
     * 设置创建时间
     * @param createdAt 创建时间
     */
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * 获取更新时间
     * @return 更新时间
     */
    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * 设置更新时间
     * @param updatedAt 更新时间
     */
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**
     * 获取标签集合
     * @return 标签集合
     */
    public Set<Tag> getTags() {
        return tags;
    }

    /**
     * 设置标签集合
     * @param tags 标签集合
     */
    public void setTags(Set<Tag> tags) {
        this.tags = tags;
    }

    /**
     * 重写equals方法，根据ID判断两个Ticket是否相等
     * @param o 比较对象
     * @return 是否相等
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Ticket ticket = (Ticket) o;

        return id != null ? id.equals(ticket.id) : ticket.id == null;
    }

    /**
     * 重写hashCode方法，根据ID生成哈希值
     * @return 哈希值
     */
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}
