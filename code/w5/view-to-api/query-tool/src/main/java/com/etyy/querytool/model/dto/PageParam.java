package com.etyy.querytool.model.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

public class PageParam {

    @Min(value = 1, message = "页码最小为1")
    private int pageNumber = 1;

    @Min(value = 1, message = "每页数量最小为1")
    @Max(value = 5000, message = "每页数量最大为5000")
    private int pageSize = 20;

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
}
