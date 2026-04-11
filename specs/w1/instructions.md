# Instrucations
## 第一周课程

## project aplpha 需求和设计文档

构建一个简单的，使用标签分类和管理 ticket 的工具。
它基于 sqlserver 数据库，使用java hibernate SpringBoot 作为后端，使用 javascript/Bootstrap 作为前端。无需用户系统，当前用户可以：

- 创建/编辑/删除/完成/取消完成 ticket
- 添加/删除 ticket 的标签
- 按照不同的标签查看 ticket 列表
- 按 title 搜索 ticket 

按照这个想法详细的帮我生成需求和设计文档，放在./specs/w1/0001-spec.md 文件中，输出为中文。


## implementation plan

按照 ./specs/w1/0001-spec.md 中的需求和设计文档，生成一个详细的实现计划，放在 ./specs/w1/0002-implementation-plan.md 文件中，输出为中文。
项目代码路径：`./code/w1/project_alpha`（实现计划见 `./specs/w1/0002-implementation-plan.md`）。


## phased 1-5 implementation

按照 ./specs/w1/0002-implementation-plan.md 完整实现这个项目的 phase 1-5 代码

## phased 6 implementation

按照 ./specs/w1/0002-implementation-plan.md 完整实现这个项目的 phase 6 代码



## 生成默认数据SQL

帮我生成基础数据，ticket 500条左右，tag 15条左右，关键帮我同步关联。
tag 数据类似 ISO、Android、Windows（平台/体系风格）。
ticket 数据需要是随机的有意义的中文，且标题与描述均不重复。
生成的数据 SQL：`./code/w1/project_alpha/default/default-data.md`（与 `specs/w1/0003-seed-data.sql` 同步）。

##  样式风格修改并对前后端添加注释

前端Css风格 改成 macOs 风格，对前端代码添加注释，说明每个组件的功能和实现。后端代码添加注释，说明每个方法的功能和实现。





