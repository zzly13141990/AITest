# Instrucations
##  数据库管理工具

这是针对 ./w2/db-query 项目的：
   - 使用 Ergonomic Python 风格来编写代码，前端使用typescript
   - 前后端要有严格的类型标注
   - 使用 pydantic 来定义数据模型
   - 所有后端生成的 json 数据，使用 camelCase 格式
   - 不需要 authentication ,任何用户都可以使用。

   
## 基本思路
基本想法：
   - 数据库连接字符串和数据库 metadata 都会存储在sqllit数据库中。我们可以根据postgres 的功能来查询系统中的表和视图信息，然后用LLM来将这些信息转换成 JSON 格式，存储到sqlite数据库中。这个信息以后可以复用。
   - 当用户使用 LLM 来生成SQL 查询时，我们可以把系统中的表和视图的信息作为 context 传递给LLM，然后LLM会根据这些信息生成SQL查询。
   - 任何输入的SQL语句，都需要经过sqlparser 解析，确保语法正确，并且仅包含 select 语句。如果语法不正确，需给出错误信息。
      - 如果查询不包含 limit 子句，默认添加 limit 1000 子句。
   - 输出格式是 json ，前端将其组织成表格，并展示出来。

后端使用Python (nv) / FastAPI / sqlglot /openai sdk 来实现。
前端使用 React / refine 5 / tailwind / ant design 来实现。sql editor 使用 monaco editor 来实现。
 
 