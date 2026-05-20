package com.etyy.querytool.model.dto;

import java.util.List;

public class PageResult<T> {

    private List<T> items;
    private long totalCount;
    private int pageNumber;
    private int pageSize;

    public PageResult() {}

    public PageResult(List<T> items, long totalCount, int pageNumber, int pageSize) {
        this.items = items;
        this.totalCount = totalCount;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }

    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }
    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
}
