package com.projectalpha.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * 标签实体类
 * 用于表示Ticket的标签信息
 */
@Entity
@Table(name = "tag")
public class Tag {

    /**
     * 标签ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 标签名称
     */
    @Column(name = "name", nullable = false, unique = true, length = 64)
    private String name;

    /**
     * 默认构造方法
     */
    public Tag() {
    }

    /**
     * 获取标签ID
     * @return 标签ID
     */
    public Long getId() {
        return id;
    }

    /**
     * 设置标签ID
     * @param id 标签ID
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * 获取标签名称
     * @return 标签名称
     */
    public String getName() {
        return name;
    }

    /**
     * 设置标签名称
     * @param name 标签名称
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 重写equals方法，根据ID判断两个标签是否相等
     * @param o 比较对象
     * @return 是否相等
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Tag tag = (Tag) o;

        return id != null ? id.equals(tag.id) : tag.id == null;
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
