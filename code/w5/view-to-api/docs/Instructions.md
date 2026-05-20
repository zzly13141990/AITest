# Instructions

## 构建 查询库返回数据JSON的接口工具

一、业务背景
开发一个查询指定数据库表数据，返回返回JSON格式的工具(数据库支持 :sqlserver,mysql,oracle)。
由第三方系统调用，第三方传递参数（JSON格式）：

数据库IP, 数据库端口,数据库类型, 数据库用户名, 数据库密码, 数据库名称,  SQL ,分页参数
如 : 数据库IP: 172.19.61.11   数据库端口：3306 数据库类型: mysql 数据库用户名: etyy_hrp 数据库密码: Lk9m48kq!  数据库名称：tender  SQL: select * from account
{
    "数据库IP": "172.19.61.11",
    "数据库端口": 3306,
    "数据库类型": "mysql",
    "数据库用户名": "etyy_hrp",
    "数据库密码": "Lk9m48kq!",
    "数据库名称": "tender",
    "SQL": "select * from account",
    "分页参数": {
        "页码": 1,
        "每页数量": 10
    }
}

返回值：
- JSON格式的查询结果
如：
{
   "执行状态": "成功",
   "执行时间": "2023-12-12 12:00:00",
   "执行消息": "成功",
   "执行耗时": "100ms",
    "查询结果": [
        {
            "字段1": "值1",
            "字段2": "值2"
        },
        {
            "字段1": "值3",
            "字段2": "值4"
        }
    ],
    "其他元数据": {
        "总记录数": 2,
        "当前页码": 1,
        "每页数量": 10
    }
}

请注意：
- 执行状态：成功或失败
- 查询结果：查询到的记录数据
- 其他元数据：查询结果的元数据，如总记录数、当前页码、每页数量等
请给我出一个需求分析，文档放在docs/0001-view-to-api-prd.md下，然后请使用codex review 工具进行reivew,将reivew结果放在docs/0001-view-to-api-review.md下，最后仔细阅读review结果，确认需求是否合理，然后相应地更新文件 ，必要时可以使用mermaid chat来辅助描述。


 ## 技术选择
使用java 实现，jdk版本为1.8, 依赖springboot框架，其它的技术选择，请给出分析和建议，。


## design 
请根据止述prd文档，给我设计方案，将设计方案放在docs/0001-view-to-api-design.md下。
同时前端日志查询页面，请给出具体设计布局，颜色、字体、大小等。需要注意，前端表格所有滚动条都只是滚动表格内容，不滚动表格头。查询时间是范围，默认为3天。
查询结果表格，列头为：执行状态、执行时间、执行消息、执行耗时、查询结果、其他元数据。
设计完后，请使用codex review skill进行review，将review结果放在docs/0001-view-to-api-design-review.md下。
确认设计是否合理，然后相应地更新文件 ，必要时可以使用mermaid chat来辅助描述。

## plan
请根据相关文档，给我一个实现计划，将实现计划放在docs/0001-view-to-api-plan.md下。
然后使用codex review skill进行review，将review结果放在docs/0001-view-to-api-plan-review.md下。
确认实现计划是否合理，然后相应地更新文件 ，必要时可以使用mermaid chat来辅助描述。