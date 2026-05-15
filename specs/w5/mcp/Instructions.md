# Instructions

## 构建 mcp server

主要的需地是在python下面创建一个Postgres的mcp: 用户有可以给特定自然语言描述的查询的需求，然后mcp server 根据结果来返回一个SQL或者返回这个查询的结果。mcp的服务器在启动的时候，应该读取它都有哪些可以访问的数据库，并且缓存这些数据库的schema：了解每一个数据库下面的都有哪些table/view/types/index等等，然后根据这些信息以及用户的输入去调用OpenAI大模型（GLM-4.7）来生成SQL。之后mcp server 应该来校验这个SQL只允许查询这个SQL，确保它能够执行并且返回有意义的结果：这里也可以把用户的输入生成sql以及返回的结果的一部份调用OpenAI来确，这样可以确保它的结果是不是有意义。
最后根据用户的输入可以是返回SQL还是返回SQL查询之后的结果来返回相应的内容。
根据这些需求帮我构建一个详细的需求文档，先不要着急去做设计，等我review完这个需地文档后，我们再讨论设计，文档放在 ./AITest/specs/w5/mcp/0001-mcp-req-prd-by-trea.md

## 修改需求

基于 ./AITest/specs/w5/mcp/0001-mcp-req-prd-by-claude.md 接口目前只需要 query 即可，其它意义不大; 另外调用codex review
skill 让 codex review 这个需求文档，并更新

## 构建设计文档

根据 ./AITest/specs/w5/mcp/0001-mcp-req-prd-by-claude.md 方档，使用FastMCP、Asyncpg、SQLGlot、Pydantic以及openai构建 pg-mcp 的设计文档，文档放在 ./AITest/specs/w5/mcp/0002--pg-mcp-design-by-claude.md 文件中。think ultra hard

## codex review design documen

调用 codex review skill 让codex review  ./AITest/specs/w5/mcp/0002-pg-mcp-design-by-claude.md 文件。之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件。

## CLAUDE.md 生成

为 ./AITest/specs/w5/mcp 生成 CLAUDE.md 。 要求：代码要符合python best practice /idomatic python,符合 SOLID/DRY
等设计思路，代码质量和测试质量要高，性能要好。

## 生成 plan

根据 ./AITest/specs/w5/mcp/002-pg-mcp-design-by-claude.md 文件，构建 pg-mcp 的实现计划， think ultra hard，文档放在 ./AITest/specs/w5/mcp/0003-pg-mcp-plan-by-claude.md 文件中。
生成完文件后，调用codex review 对生成的计划markdown文件进行审查，之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件。

## 实现代码plan

根据 ./AITest/specs/w5/mcp/0003-pg-mcp-plan-by-claude.md 和./AITest/specs/w5/mcp/0002-pg-mcp-design-by-claude.md文档，使用子代理完整实现 pg-mcp所有阶段
代码放在：./AITest/code/w5/pg-mcp/ 目录下。
代码实现完后调用 Codex Review技能让Codex Review 对整个代码进行审查，以检查其是否符合设计和实现计划。将审查结果写入./specs/w5/mcp/0006-pg-mcp-impl-plan-review\.md 文件中 ，之后仔细阅读 review 的结果，修正代码。
