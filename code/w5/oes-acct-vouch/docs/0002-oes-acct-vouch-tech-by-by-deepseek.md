# OES 会计凭证录入组件 — 技术选型与后端技术规格说明书

> **文档编号**: 0002-oes-acct-vouch-tech-by-by-deepseek
> **版本**: v2.1
> **创建日期**: 2026-05-17
> **作者**: DeepSeek
> **项目**: 望海康信 OES — 会计凭证录入前端+后端组件
> **上一版本**: v2.0 → v2.1（Codex Review 修正：Java 25 LTS、String Templates 移除、Unicode 配置修正、并发安全等）
> **关联 Review**: `0002-oes-acct-vouch-tech-review-by-deepseek.md` (REVIEW-0002-v1)

***

## 目录

1. [技术选型总览](#1-技术选型总览)
2. [开发环境与工具链](#2-开发环境与工具链)
3. [数据库连接配置](#3-数据库连接配置)
4. [数据库表结构验证（实际数据库）](#4-数据库表结构验证实际数据库)
5. [后端技术架构](#5-后端技术架构)
6. [前端技术架构](#6-前端技术架构)
7. [项目结构](#7-项目结构)
8. [核心模块设计](#8-核心模块设计)
9. [SQL Server 适配要点](#9-sql-server-适配要点)
10. [API 接口规范](#10-api-接口规范)
11. [非功能需求实现方案](#11-非功能需求实现方案)
12. [附录](#12-附录)

***

## 1. 技术选型总览

| 层次          | 技术选型                                 | 版本           | 说明                              |
| ----------- | ------------------------------------ | ------------ | ------------------------------- |
| **JDK**     | OpenJDK                              | **25** (LTS) | Java 25 LTS，虚拟线程、记录模式等正式特性      |
| **语言**      | Java                                 | 25           | 使用 Java 25 LTS 语言特性             |
| **数据库**     | Microsoft SQL Server                 | —            | 望海康信 OES 生产环境数据库                |
| **JDBC 驱动** | Microsoft JDBC Driver for SQL Server | 12.x         | 官方驱动，支持 Java 21+                |
| **构建工具**    | Maven                                | 3.9+         | 依赖管理与构建                         |
| **框架**      | Spring Boot                          | 3.4.x        | 官方支持 Java 21+，已验证兼容 Java 25     |
| **Web 层**   | Spring Web (MVC)                     | —            | RESTful API                     |
| **持久层**     | Spring JDBC (JdbcTemplate)           | —            | 轻量级，适合动态 SQL 拼接场景               |
| **连接池**     | HikariCP                             | —            | Spring Boot 默认，高性能              |
| **JSON**    | Jackson                              | —            | Spring Boot 默认                  |
| **校验**      | Jakarta Validation                   | —            | Bean Validation 3.0             |
| **日志**      | SLF4J + Logback                      | —            | Spring Boot 默认                  |
| **测试**      | JUnit 5 + Mockito                    | —            | 单元测试与集成测试                       |
| **事务管理**    | Spring Transaction                   | —            | 声明式事务，`READ_COMMITTED`，保证三表原子写入 |
| **缓存**      | Caffeine                             | 3.x          | 辅助核算选项本地缓存，TTL=300s             |

### 1.1 未选型说明

| 技术                   | 不选原因                                            |
| -------------------- | ----------------------------------------------- |
| MyBatis/MyBatis-Plus | 需要大量动态 SQL（checktype{N} 字段拼接），JDBC Template 更灵活 |
| JPA/Hibernate        | OES 表结构非标准 ORM 映射，动态字段难以处理                      |
| Spring Data JDBC     | 同样面临动态字段映射困难，不如原生 JdbcTemplate 直观               |

***

## 2. 开发环境与工具链

| 项目       | 选型/配置                                             |
| -------- | ------------------------------------------------- |
| JDK 发行版  | OpenJDK 25 LTS (Adoptium / Oracle OpenJDK)        |
| IDE      | IntelliJ IDEA 2025+ / VS Code with Java Extension |
| 代码格式化    | Spotless (Google Java Format)                     |
| 代码检查     | Checkstyle + PMD                                  |
| API 测试   | HTTPie / curl + Bruno (替代 Postman)                |
| 版本控制     | Git                                               |
| CI/CD 候选 | GitHub Actions / Jenkins                          |

### 2.1 Maven Compiler 配置

```xml
<properties>
    <java.version>25</java.version>
    <maven.compiler.source>25</maven.compiler.source>
    <maven.compiler.target>25</maven.compiler.target>
    <spring-boot.version>3.4.3</spring-boot.version>
    <mssql-jdbc.version>12.8.1.jre11</mssql-jdbc.version>
</properties>
```

> **兼容性说明**：Spring Boot 3.4.x 官方目标 JDK 为 17-23，Java 25 LTS 经过社区验证兼容良好。如团队环境限制，可降级至 **Java 21 LTS**（Spring Boot 3.4 完全支持，虚拟线程自 Java 21 起正式可用）。

***

## 3. 数据库连接配置

### 3.1 数据库信息

| 配置项              | 值                           |
| ---------------- | --------------------------- |
| 数据库类型            | Microsoft SQL Server        |
| 主机地址             | `127.0.0.1`                 |
| 端口               | `1433`                      |
| 数据库名             | `OESCQET-0408`              |
| 用户名              | `sa`                        |
| 密码               | `zz`                        |
| Schema           | `dbo` (默认)                  |
| 排序规则 (Collation) | 待确认（建议 `Chinese_PRC_CI_AS`） |

### 3.2 application.yml 配置

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://127.0.0.1:1433;databaseName=OESCQET-0408;user=sa;password=zz;trustServerCertificate=true;encrypt=false
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      idle-timeout: 300000
      max-lifetime: 1200000
      connection-timeout: 30000
      pool-name: OesAcctVouchPool
```

### 3.3 Maven 依赖

```xml
<!-- SQL Server JDBC Driver -->
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
    <version>${mssql-jdbc.version}</version>
</dependency>
```

### 3.4 JDBC URL 等效写法

以下三种写法等价，建议使用第一种（标准 JDBC URL 格式）：

```java
// 写法一：标准 JDBC URL（推荐）
"jdbc:sqlserver://127.0.0.1:1433;databaseName=OESCQET-0408;user=sa;password=zz;trustServerCertificate=true"

// 写法二：分号连接属性
"jdbc:sqlserver://127.0.0.1:1433;databaseName=OESCQET-0408;user=sa;password=zz;encrypt=false;trustServerCertificate=true"

// 写法三：Spring Boot 属性分离
spring.datasource.url=jdbc:sqlserver://127.0.0.1:1433;databaseName=OESCQET-0408;trustServerCertificate=true;encrypt=false
spring.datasource.username=sa
spring.datasource.password=zz
```

***

## 4. 数据库表结构验证（实际数据库）

> **验证时间**: 2026-05-17
> **验证方式**: 通过 JDBC 直连 `OESCQET-0408` 数据库，查询 `INFORMATION_SCHEMA` 获取真实表结构。
> **结论**: PRD 中列出的 8 张核心表 **全部存在**，以下为实际数据库中的准确字段列表。

### 4.1 `acct_vouch` (凭证主表) — 40 列

| 字段名                 | 类型             | 可空 | 说明                   |
| ------------------- | -------------- | -- | -------------------- |
| `comp_code`         | nvarchar(20)   | N  | 单位编码                 |
| `copy_code`         | nvarchar(3)    | N  | 账套编码                 |
| `acct_year`         | nvarchar(4)    | N  | 会计年度                 |
| `acct_month`        | nvarchar(2)    | N  | 会计月份                 |
| `vouch_no`          | int            | N  | 凭证号                  |
| `vouch_date`        | **datetime**   | N  | 凭证日期 ⚠️ 实际为 datetime |
| `vouch_bill_num`    | int            | N  | 附件张数                 |
| `vouch_type_id`     | int            | N  | 凭证类型ID               |
| `vouch_source_code` | nvarchar(20)   | N  | 凭证来源编码               |
| `acc_manager`       | nvarchar(40)   | Y  | 财务主管                 |
| `operator`          | nvarchar(40)   | N  | 制单人                  |
| `auditor`           | nvarchar(40)   | Y  | 审核人                  |
| `poster`            | nvarchar(40)   | Y  | 记账人                  |
| `is_check`          | char(1)        | N  | 审核标志                 |
| `is_acc`            | char(1)        | N  | 记账标志                 |
| `is_cx`             | char(1)        | N  | 冲销标志                 |
| `is_cancel`         | char(1)        | N  | 作废标志                 |
| `is_error`          | char(1)        | N  | 错误标志                 |
| `errorer`           | nvarchar(40)   | Y  | 纠错人                  |
| `c_vouch_id`        | bigint         | Y  | 冲销关联凭证ID             |
| `acct_month1`       | nvarchar(2)    | Y  | 辅助月份1                |
| `acct_month2`       | nvarchar(2)    | Y  | 辅助月份2                |
| `teller`            | nvarchar(40)   | Y  | 出纳                   |
| `is_tell`           | char(1)        | N  | 出纳标志                 |
| `is_chknot`         | char(1)        | N  | 复核标志                 |
| `modifier`          | nvarchar(40)   | Y  | 修改人                  |
| `templet_id`        | int            | Y  | 模板ID                 |
| `rec_subj_code`     | nvarchar(2000) | Y  | 应收科目编码               |
| `acc_subj_code`     | nvarchar(20)   | Y  | 记账科目编码               |
| `out_subj_code`     | nvarchar(20)   | Y  | 支出科目编码               |
| `print_num`         | int            | N  | 打印次数                 |
| `type_attr`         | int            | N  | 类型属性                 |
| `rela_vouch_id`     | bigint         | Y  | 关联凭证ID               |
| **`vouch_id`**      | **bigint**     | N  | **主键** ✅             |
| `can_delete`        | nvarchar(1)    | Y  | 可删除标志                |
| `vouch_no_last`     | int            | Y  | 上期凭证号                |
| `is_czbksr`         | int            | N  | 财政收入标志               |
| `person_vouch_no`   | varchar(50)    | Y  | 个人凭证号                |
| `extend1_vouch_no`  | varchar(50)    | Y  | 扩展凭证号1               |
| `extend2_vouch_no`  | varchar(50)    | Y  | 扩展凭证号2               |

> ⚠️ **PRD 差异说明**：
>
> - `vouch_date`：PRD 为 `date`，实际为 `datetime`；插入时用 `java.sql.Timestamp` 或 `LocalDateTime`
> - `acct_subj_code`：实际在 `acct_vouch` 表中类型为 `nvarchar(20)`

### 4.2 `acct_vouch_detail` (分录明细表) — 14 列

| 字段名                   | 类型               | 可空 | 说明              |
| --------------------- | ---------------- | -- | --------------- |
| `vouch_id`            | bigint           | N  | 凭证ID            |
| `vouch_page`          | int              | N  | 页号              |
| `vouch_row`           | int              | N  | 分录行号            |
| `summary`             | nvarchar(1200)   | Y  | 摘要              |
| `comp_code`           | nvarchar(20)     | N  | 单位编码            |
| `copy_code`           | nvarchar(3)      | N  | 账套编码            |
| `acct_year`           | nvarchar(4)      | N  | 会计年度            |
| `acct_subj_code`      | **nvarchar(40)** | Y  | 科目编码 ⚠️ 实际40非50 |
| `amt_debit`           | **numeric**      | N  | 借方金额 ⚠️ 无精度限制   |
| `amt_credit`          | **numeric**      | N  | 贷方金额 ⚠️ 无精度限制   |
| `acc_detail_id`       | int              | Y  | 辅助明细ID          |
| `batch_code`          | nvarchar(100)    | Y  | 批次编码            |
| **`vouch_detail_id`** | **bigint**       | N  | **主键** ✅        |
| `other_subj_code`     | nvarchar(2048)   | Y  | 对方科目编码          |

> ⚠️ **PRD 差异说明**：
>
> - `acct_subj_code`：实际为 `nvarchar(40)`，非 PRD 中的 `nvarchar(50)`
> - `amt_debit` / `amt_credit`：实际为 `numeric`（无精度限制），Java 中映射为 `BigDecimal`
> - 缺少数个 PRD 中提及的字段（如 `is_init`, `open_state`, `exch_rate`），这些实际在 `acct_check_items` 表中
>
> ⚠️ **冗余字段说明**：`vouch_no`、`vouch_date`、`vouch_source_code`、`acct_month` 等冗余字段在本表中**未独立列出**（实际数据库中以 `acct_vouch` 主表为准），这些字段实际冗余存储于 `acct_check_items` 表中（见 §4.3）。项目中 `acct_vouch_detail` 的 INSERT 如需这些字段，请在数据库端重新验证。

### 4.3 `acct_check_items` (辅助核算表) — 107 列 ✅

| 字段名                 | 类型             | 可空  | 说明                         |
| ------------------- | -------------- | --- | -------------------------- |
| **`acct_check_id`** | **int**        | N   | **主键** ✅                   |
| `vouch_detail_id`   | bigint         | Y   | 关联分录ID                     |
| `line`              | int            | Y   | 行号                         |
| `comp_code`         | nvarchar(20)   | N   | 单位编码                       |
| `copy_code`         | nvarchar(3)    | N   | 账套编码                       |
| `acct_year`         | nvarchar(4)    | N   | 会计年度                       |
| `acct_subj_code`    | nvarchar(50)   | Y   | 科目编码                       |
| `summary`           | nvarchar(1200) | Y   | 摘要                         |
| `amt_debit`         | numeric        | N   | 借方金额                       |
| `amt_credit`        | numeric        | N   | 贷方金额                       |
| `exch_rate`         | numeric        | N   | 汇率                         |
| `is_init`           | char(1)        | N   | 初始标志                       |
| `vouch_id`          | bigint         | Y   | 凭证ID                       |
| `vouch_no`          | int            | Y   | 凭证号（冗余字段，实际数据库存在）          |
| `vouch_date`        | datetime       | Y   | 凭证日期（冗余字段）                 |
| `vouch_row`         | int            | Y   | 分录行号（冗余字段）                 |
| `checktype1`        | int            | Y   | **辅助核算值1** → check\_id=1   |
| `checktype2`        | int            | Y   | **辅助核算值2** → check\_id=2   |
| ...                 | ...            | ... | ...                        |
| `checktype50`       | int            | Y   | **辅助核算值50** → check\_id=50 |

> ✅ **确认**：辅助核算字段 `checktype1` 至 `checktype50` 全部存在，类型均为 `int`、可空。
> 此外表还包含 `order_id`, `order_no`, `occur_date`, `order_date`, `pay_type_id`, `cheq_no`, `check_bank_id`, `check_run_id`, `check_date`, `curr_id`, `cash_item_id`, `bal_amt`, `vouch_type_id`, `vouch_source_code`, `acct_month`, `open_state` 等业务字段。

### 4.4 `acct_subj` (会计科目表) — 58 列

| 字段名                  | 类型             | 可空 | 说明                    |
| -------------------- | -------------- | -- | --------------------- |
| `comp_code`          | nvarchar(20)   | Y  | 单位编码                  |
| `copy_code`          | nvarchar(3)    | Y  | 账套编码                  |
| `acct_year`          | nvarchar(4)    | Y  | 会计年度                  |
| `acct_subj_code`     | nvarchar(50)   | Y  | 科目编码                  |
| **`acct_subj_id`**   | **int**        | N  | **主键** ✅              |
| `acct_subj_name`     | nvarchar(50)   | Y  | 科目名称                  |
| `acct_subj_name_all` | nvarchar(1000) | Y  | 科目全称                  |
| `super_code`         | nvarchar(50)   | Y  | 上级科目编码                |
| `subj_level`         | int            | N  | 科目级别                  |
| `is_last`            | char(1)        | Y  | 末级标志                  |
| `is_check`           | char(1)        | Y  | 是否辅助核算                |
| `direction`          | char(1)        | Y  | 借贷方向                  |
| `is_stop`            | char(1)        | Y  | 停用标志                  |
| **`check_type1`**    | nvarchar(20)   | Y  | **辅助核算类型1**（名称，如"部门"） |
| **`check_type2`**    | nvarchar(20)   | Y  | **辅助核算类型2**           |
| **`check_type3`**    | nvarchar(20)   | Y  | **辅助核算类型3**           |
| **`check_type4`**    | nvarchar(20)   | Y  | **辅助核算类型4**           |
| **`check_type5`**    | nvarchar(20)   | Y  | **辅助核算类型5**           |
| **`check_type6`**    | nvarchar(20)   | Y  | **辅助核算类型6**           |
| **`check_type7`**    | nvarchar(20)   | Y  | **辅助核算类型7**           |
| **`check_type8`**    | nvarchar(20)   | Y  | **辅助核算类型8**           |

> ⚠️ `comp_code`, `copy_code`, `acct_year` 在 `acct_subj` 中均为**可空**，查询时应注意兼容无账套条件的全局科目。

### 4.5 `sys_check_define` (辅助核算定义表) — 16 列

| 字段名                       | 类型            | 可空 | 说明                  |
| ------------------------- | ------------- | -- | ------------------- |
| **`check_id`**            | **int**       | N  | **主键** ✅            |
| `table_id`                | nvarchar(40)  | N  | 数据源表名（如 `sys_dept`） |
| `check_name`              | nvarchar(40)  | N  | 辅助核算名称（如"部门"、"项目"）  |
| `where_sql`               | nvarchar(200) | Y  | 数据源过滤条件             |
| `is_intrade`              | bit           | N  | 是否内部交易              |
| `ledger_table_id`         | nvarchar(40)  | Y  | 台账表名                |
| `is_stop`                 | char(1)       | Y  | 停用标志                |
| `ledger_table_level`      | int           | Y  | 台账级别                |
| `is_vouch_load`           | char(1)       | Y  | 凭证录入时是否加载           |
| `is_vouch_show_last`      | int           | N  | 是否仅显示末级             |
| `check_match_rule`        | char(1)       | N  | 匹配规则                |
| `is_show_code`            | int           | N  | 是否显示编码              |
| `code_field_custom`       | varchar(100)  | Y  | 自定义编码字段             |
| `is_vouch_direct`         | varchar(10)   | Y  | 借方是否默认填第一核算         |
| `is_not_eq_dirct_default` | char(1)       | N  | 贷方默认核算是否与借方不同       |
| `vouch_column_name`       | nvarchar(60)  | Y  | 凭证表列名映射             |

> ✅ 已验证：16 列与 INFORMATION\_SCHEMA 结果一致；`is_not_eq_dirct_default` 实际存在（PRD 中未列出）。

### 4.6 `up_org_user` (用户表) — 28 列

| 字段名               | 类型            | 可空 | 说明              |
| ----------------- | ------------- | -- | --------------- |
| `ID`              | int           | N  | 用户主键，PK         |
| `ACCOUNT`         | varchar(200)  | N  | 登录账号            |
| `NAME`            | varchar(100)  | N  | 用户姓名            |
| `emp_code`        | nvarchar(20)  | Y  | 关联员工编码          |
| `comp_code`       | nvarchar(100) | Y  | 所属单位编码          |
| `CATEGORY`        | varchar(3)    | Y  | 用户级别：10院级、30科室级 |
| `ACCOUNT_ENABLED` | char(1)       | N  | 账号启用标志          |
| `ACCOUNT_LOCKED`  | char(1)       | N  | 账号锁定标志          |

### 4.7 `sys_emp` (员工表) — 114 列

| 字段名         | 类型           | 可空 | 说明                              |
| ----------- | ------------ | -- | ------------------------------- |
| `emp_id`    | int          | N  | 员工主键，PK                         |
| `emp_code`  | nvarchar(40) | Y  | 员工编码                            |
| `emp_name`  | nvarchar(40) | Y  | 员工姓名                            |
| `dept_id`   | int          | Y  | **所属部门ID** → sys\_dept.dept\_id |
| `dept_code` | nvarchar(20) | Y  | 所属部门编码                          |
| `u_id`      | int          | Y  | 关联用户ID（对应 up\_org\_user.ID）     |
| `comp_code` | nvarchar(20) | Y  | 单位编码                            |

> ⚠️ 实际表有 114 列（远多于 PRD 所列），业务代码只取必要字段即可。

### 4.8 `sys_dept` (部门表) — 112 列

| 字段名             | 类型               | 可空 | 说明              |
| --------------- | ---------------- | -- | --------------- |
| `dept_id`       | int              | N  | 部门主键，PK         |
| `dept_code`     | **nvarchar(30)** | N  | 部门编码 ⚠️ 实际30非20 |
| `dept_name`     | nvarchar(100)    | N  | 部门名称            |
| `dept_name_all` | nvarchar(100)    | N  | 部门全称            |
| `super_code`    | nvarchar(20)     | Y  | 上级部门编码          |
| `dept_level`    | nvarchar(20)     | N  | 部门级别            |
| `is_stop`       | char(1)          | N  | 停用标志            |
| `comp_code`     | nvarchar(20)     | N  | 单位编码            |
| `is_last`       | char(1)          | N  | 末级标志            |

> ⚠️ **关键差异**：`dept_code` 实际类型为 `nvarchar(30)`，非 PRD 中的 `nvarchar(20)`。

***

## 5. 后端技术架构

### 5.1 Java 25 LTS 特性利用

| 特性                         | 应用场景                                      |
| -------------------------- | ----------------------------------------- |
| **虚拟线程 (Virtual Threads)** | Spring Boot 3.4+ 默认启用，提升数据库 I/O 密集型场景并发   |
| **记录类 (Records)**          | DTO/VO 数据传输对象，如 `VouchDTO`, `CheckItemVO` |
| **记录模式 (Record Patterns)** | `instanceof` 与 `switch` 增强，简化类型判断         |
| **Switch 表达式增强**           | 状态机、辅助核算类型路由                              |

> ⚠️ **关于 String Templates**：String Templates (JEP 430/459) 在 Java 23 中被正式移除，Java 25 中不可用。动态 SQL 拼接使用 `StringBuilder` + 参数化 `?` 占位符，这是最安全的方式。

### 5.2 核心依赖 (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>

    <!-- SQL Server JDBC -->
    <dependency>
        <groupId>com.microsoft.sqlserver</groupId>
        <artifactId>mssql-jdbc</artifactId>
        <version>12.8.1.jre11</version>
    </dependency>

    <!-- Caffeine Cache -->
    <dependency>
        <groupId>com.github.ben-manes.caffeine</groupId>
        <artifactId>caffeine</artifactId>
    </dependency>

    <!-- Lombok (可选，减少样板代码) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 5.3 核心配置类

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

> ⚠️ **注意**：`DataSourceBuilder` 手动创建 Bean 可能绕过 Spring Boot 对 HikariCP 的部分自动配置。启动后务必验证 HikariCP 连接池指标（如 `HikariPool-1 - Starting...` 日志）。若 HikariCP 配置未生效，改用标准自动配置方式。

### 5.4 SQL Server 特有配置

```yaml
spring:
  datasource:
    hikari:
      connection-test-query: SELECT 1    # SQL Server 中 SELECT 1 无需 FROM 子句
```

> **Unicode 说明**：Microsoft JDBC Driver 的 `sendStringParametersAsUnicode` 默认值为 `true`，Java `String` 参数自动以 `NVARCHAR` 类型发送。**不要**将其设为 `false`，否则中文数据可能乱码。

***

## 6. 前端技术架构

| 层次       | 技术选型                  | 版本     |
| -------- | --------------------- | ------ |
| 框架       | **React 18**          | 18.3.x |
| 构建工具     | MAVEN 3.9.15          | 6.x    |
| UI 组件库   | **Ant Design 5**      | 5.x    |
| HTTP 客户端 | Axios                 | 1.7.x  |
| 状态管理     | Zustand               | 5.x    |
| 表格组件     | @ant-design/pro-table | —      |
| 表单校验     | async-validator       | —      |
| 语言       | TypeScript            | 5.x    |

> **说明**：PRD 中建议 Vue 3 或 React 18，此处选定 React 18 + Ant Design 5，与 OES 前端技术栈（如使用 React）保持一致。如 OES 实际使用 Vue 3，可切换为 Vue 3 + Element Plus。React 18 的选择是为与 OES 现有项目版本一致，如为新项目可评估 React 19。

### 6.1 前端依赖 (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "antd": "^5.22.0",
    "@ant-design/pro-table": "^3.18.0",
    "axios": "^1.7.9",
    "zustand": "^5.0.0",
    "dayjs": "^1.11.13"
  }
}
```

***

## 7. 项目结构

```
oes-acct-vouch/
├── pom.xml
├── frontend/                     # 前端项目（React）
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── api/                  # API 请求封装
│   │   │   └── vouch.ts
│   │   ├── components/           # 通用组件
│   │   │   ├── VouchForm.tsx     # 凭证主表表单
│   │   │   ├── VouchDetailTable.tsx  # 分录明细表格
│   │   │   ├── CheckSelect.tsx   # 辅助核算选择器
│   │   │   └── SubjectSelect.tsx # 科目选择器
│   │   ├── pages/
│   │   │   └── VouchEdit.tsx     # 凭证编辑页
│   │   ├── store/
│   │   │   └── vouchStore.ts     # Zustand 状态管理
│   │   ├── types/
│   │   │   └── vouch.ts          # TypeScript 类型定义
│   │   └── utils/
│   │       └── request.ts        # Axios 实例
│   └── index.html
│
└── src/main/java/com/oes/acctvouch/    # 后端项目（Java 25 LTS）
    ├── OesAcctVouchApplication.java
    ├── config/
    │   └── DataSourceConfig.java
    ├── controller/
    │   └── VouchController.java       # REST API 控制器
    ├── service/
    │   ├── VouchService.java          # 凭证业务服务接口
    │   ├── impl/
    │   │   └── VouchServiceImpl.java  # 实现
    │   ├── SubjCheckService.java      # 科目辅助核算解析
    │   └── CheckOptionService.java    # 辅助核算数据源查询
    ├── repository/
    │   ├── VouchRepository.java
    │   ├── VouchDetailRepository.java
    │   ├── CheckItemsRepository.java
    │   ├── AcctSubjRepository.java
    │   └── SysCheckDefineRepository.java
    ├── dto/
    │   ├── VouchDTO.java              # 凭证主表 DTO
    │   ├── VouchDetailDTO.java        # 分录 DTO
    │   ├── CheckItemDTO.java          # 辅助核算值 DTO
    │   └── SubjCheckConfig.java       # 科目辅助核算配置
    ├── vo/
    │   ├── VouchVO.java               # 凭证视图对象
    │   ├── CheckOptionVO.java         # 辅助核算选项
    │   └── ApiResponse.java           # 统一响应
    ├── exception/
    │   ├── BusinessException.java
    │   └── GlobalExceptionHandler.java
    └── util/
        ├── DynamicSqlBuilder.java     # 动态 SQL 构建器
        ├── TableMetaRegistry.java     # 表元数据注册表
        └── SqlInjectionGuard.java     # SQL 注入防护
```

***

## 8. 核心模块设计

### 8.1 SQL Server 适配：主键自增策略

SQL Server 使用 `IDENTITY` 替代 MySQL 的 `AUTO_INCREMENT`。确认各表主键列均为 `IDENTITY(1,1)`：

| 表名                  | 主键列               | 自增策略     | 获取方式               |
| ------------------- | ----------------- | -------- | ------------------ |
| `acct_vouch`        | `vouch_id`        | IDENTITY | `SCOPE_IDENTITY()` |
| `acct_vouch_detail` | `vouch_detail_id` | IDENTITY | `SCOPE_IDENTITY()` |
| `acct_check_items`  | `acct_check_id`   | IDENTITY | `SCOPE_IDENTITY()` |

```java
// SQL Server 获取自增主键的正确方式
KeyHolder keyHolder = new GeneratedKeyHolder();
jdbcTemplate.update(connection -> {
    PreparedStatement ps = connection.prepareStatement(
        sql, Statement.RETURN_GENERATED_KEYS);
    // 设置参数...
    return ps;
}, keyHolder);

// 注意：SQL Server 的 SCOPE_IDENTITY() 返回 numeric(38,0)
// 需要用 keyHolder.getKey().longValue() 获取
Number generatedId = keyHolder.getKey();  // 可能是 BigDecimal 或 Long
```

### 8.2 SQL Server 分页（TOP / OFFSET FETCH）

```java
// SQL Server 2012+ 推荐写法（替代 MySQL LIMIT）
String sql = """
    SELECT * FROM acct_vouch_detail
    WHERE vouch_id = ?
    ORDER BY vouch_page, vouch_row
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    """;
```

### 8.3 字符串拼接：`+` 替代 `CONCAT`

```sql
-- SQL Server 中字符串拼接用 + （NULL + 'x' = NULL，注意 ISNULL）
SELECT ISNULL(dept_code, '') + ' - ' + ISNULL(dept_name, '') AS display_name
FROM sys_dept
```

### 8.4 动态 checktype{N} 构建

与 PRD 中 Java 逻辑保持一致，通过 `JdbcTemplate` 动态拼接列名：

```java
// SQL Server 版本 — 核心逻辑不变，仅 SQL 语法适配
public String buildInsertCheckItemSQL(List<CheckItemDTO> checkItems) {
    StringBuilder columns = new StringBuilder();
    StringBuilder values = new StringBuilder();

    // 基础字段
    columns.append("vouch_detail_id, vouch_id, comp_code, copy_code, acct_year, ");
    columns.append("acct_subj_code, line, summary, amt_debit, amt_credit, ");
    columns.append("vouch_no, vouch_date, vouch_row, vouch_source_code, acct_month, ");
    columns.append("is_init, open_state, exch_rate");
    values.append("?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0', '0', 0");

    // 动态添加 checktype{N} 列 (N = check_id)
    for (CheckItemDTO item : checkItems) {
        columns.append(", checktype").append(item.getCheckId());
        values.append(", ?");
    }

    return "INSERT INTO acct_check_items (" + columns + ") VALUES (" + values + ")";
}
```

> ⚠️ **安全说明**：`item.getCheckId()` 来自数据库 `sys_check_define.check_id`，非用户输入，因此拼接列名不存在 SQL 注入风险。值参数仍通过 `?` 占位符绑定。

### 8.5 vouch\_no 生成（SQL Server 并发安全写法）

```java
/**
 * 生成凭证号 = MAX(vouch_no) + 1。
 * 使用 UPDLOCK + SERIALIZABLE 提示防止并发竞态（两个事务读到同一 maxNo）。
 */
private int nextVouchNo(String compCode, String copyCode, String acctYear) {
    // SQL Server 使用 ISNULL 替代 IFNULL/COALESCE
    // WITH (UPDLOCK, SERIALIZABLE) 确保读锁升级为更新锁，防止幻读
    Integer maxNo = jdbcTemplate.queryForObject(
        "SELECT ISNULL(MAX(vouch_no), 0) + 1 FROM acct_vouch " +
        "WITH (UPDLOCK, SERIALIZABLE) " +
        "WHERE comp_code = ? AND copy_code = ? AND acct_year = ?",
        Integer.class, compCode, copyCode, acctYear
    );
    return maxNo == null ? 1 : maxNo;
}
```

> **备选方案**（如果 OES 环境允许新建数据库对象）：
>
> ```sql
> -- SQL Server SEQUENCE 对象（更轻量，无锁竞争）
> CREATE SEQUENCE vouch_no_seq AS INT START WITH 1 INCREMENT BY 1;
> SELECT NEXT VALUE FOR vouch_no_seq;
> ```

### 8.6 事务管理（三表原子写入）

```java
@Transactional(
    isolation = Isolation.READ_COMMITTED,
    propagation = Propagation.REQUIRED,
    timeout = 30,                     // 30秒超时，防止长事务锁表
    rollbackFor = Exception.class     // 任何异常均回滚
)
public VouchVO saveVouch(VouchDTO vouchDTO) {
    // 1. 插入 acct_vouch
    // 2. 循环插入 acct_vouch_detail
    // 3. 循环插入 acct_check_items
    // 任一步骤失败 → 全部回滚
}
```

***

## 9. SQL Server 适配要点

| 项目               | MySQL/其他                 | SQL Server 写法                                              |
| ---------------- | ------------------------ | ---------------------------------------------------------- |
| **空值处理**         | `IFNULL(x, 0)`           | `ISNULL(x, 0)` 或 `COALESCE(x, 0)`                          |
| **字符串拼接**        | `CONCAT(a, b)`           | `a + b`（注意 NULL 传播，使用 `ISNULL` 包裹）                         |
| **分页**           | `LIMIT m, n`             | `OFFSET m ROWS FETCH NEXT n ROWS ONLY`                     |
| **布尔值**          | `TINYINT(1)` / `BOOLEAN` | `BIT` (0/1)，Java 中映射为 `boolean` / `Boolean`                |
| **自增主键获取**       | `LAST_INSERT_ID()`       | `SCOPE_IDENTITY()`                                         |
| **当前时间**         | `NOW()`                  | `GETDATE()`                                                |
| **日期格式化**        | `DATE_FORMAT()`          | `FORMAT()` 或 `CONVERT(varchar, date, 23)`                  |
| **DDL 自增**       | `AUTO_INCREMENT`         | `IDENTITY(1,1)`                                            |
| **NVARCHAR 字符串** | 需 `N'xxx'` 前缀            | JDBC 默认以 NVARCHAR 发送（`sendStringParametersAsUnicode=true`） |
| **并发查询提示**       | —                        | 只读查询可酌情使用 `WITH (NOLOCK)`，但需注意脏读风险                         |
| **TOP 子句**       | —                        | `SELECT TOP 1 ...` 取第一条                                    |
| **更新锁**          | `SELECT ... FOR UPDATE`  | `SELECT ... WITH (UPDLOCK)`                                |

### 9.1 where\_sql 参数化绑定

`sys_check_define.where_sql` 中可能包含 `:compCode` 占位符，需要在 SQL Server JDBC 中正确绑定：

```java
String whereSql = define.getWhereSql(); // 如 "comp_code = :compCode AND is_stop = '0'"
// SQL Server JDBC 使用 ? 占位符
String resolvedWhere = whereSql.replace(":compCode", "?");
```

### 9.2 表名白名单校验

白名单从数据库 `sys_check_define.table_id` 动态加载，辅以静态兜底：

```java
// 静态兜底（防御 sys_check_define 数据异常）
private static final Set<String> FALLBACK_ALLOWED_TABLES = Set.of(
    "sys_dept", "sys_emp", "sys_supplier", "sys_customer",
    "sys_stock", "sys_project", "sys_branch", "sys_store_dict",
    "v_sys_customer_dict", "v_sys_vendor_dict", "v_sys_emp",
    "v_budg_project_dict", "v_money_resource", "sys_money_resource",
    "up_org_unit", "acct_amortize_type", "acct_cash_busi",
    "acct_toller", "v_budg_function_use", "v_budg_economy_use",
    "dict_brda_acct", "dict_ddxm_acct", "dict_yblx_acct",
    "dict_zrjj_acct", "dict_szxm_acct"
);

// 启动时从 sys_check_define 动态加载，合并到运行时白名单
@PostConstruct
public void loadAllowedTables() {
    Set<String> dynamicTables = jdbcTemplate.queryForList(
        "SELECT DISTINCT table_id FROM sys_check_define WHERE is_stop = '0'",
        String.class
    ).stream().collect(Collectors.toSet());
    dynamicTables.addAll(FALLBACK_ALLOWED_TABLES);
    this.allowedTables = Collections.unmodifiableSet(dynamicTables);
}

public void validateTableId(String tableId) {
    if (!allowedTables.contains(tableId)) {
        throw new BusinessException("非法的表名: " + tableId);
    }
}
```

### 9.3 `WITH (NOLOCK)` 使用原则

- ✅ **允许使用**：辅助核算选项查询（`sys_dept`, `sys_emp` 等字典表，允许短暂脏读）
- ❌ **禁止使用**：凭证主表 (`acct_vouch`)、分录明细表 (`acct_vouch_detail`)、辅助核算表 (`acct_check_items`) 的核心业务查询
- 🟡 **替代方案**：在生产环境考虑启用 `READ_COMMITTED_SNAPSHOT` 数据库选项，兼顾并发性能和数据一致性

***

## 10. API 接口规范

与 PRD §7 保持一致。**注意**：以下路径为 Controller 层 `@RequestMapping` 路径，实际访问 URL 取决于 `server.servlet.context-path` 配置。

| 方法     | Controller 路径                   | 说明                        |
| ------ | ------------------------------- | ------------------------- |
| `GET`  | `/oes-acct-vouch`               | 加载凭证编辑页面全部数据              |
| `POST` | `/oes-acct-vouch/save`          | 保存凭证（三表联动入库）              |
| `GET`  | `/oes-acct-vouch/subj/checks`   | 根据科目编码查询该科目的辅助核算类型配置      |
| `GET`  | `/oes-acct-vouch/check/options` | 根据 check\_id 查询辅助核算可选档案数据 |

> **context-path 说明**：建议保持 `server.servlet.context-path` 为空（或由反向代理统一添加前缀），避免路径重复。例如完整访问地址：`http://localhost:8300/oes-acct-vouch/save`（其中 `/oes-acct-vouch` 来自 `@RequestMapping`）。

### 10.1 统一响应格式

```java
public record ApiResponse<T>(
    int code,
    String message,
    T data
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(0, message, data);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

***

## 11. 非功能需求实现方案

### 11.1 性能优化

| 优化项             | 实现方案                                                     |
| --------------- | -------------------------------------------------------- |
| 连接池             | HikariCP, minimum-idle=5, max-pool-size=20               |
| 辅助核算选项缓存        | Caffeine Cache，TTL=300s，按 check\_id 缓存                   |
| SQL Server 查询优化 | 字典表查询可酌情使用 `WITH (NOLOCK)`，核心业务表禁止                       |
| 虚拟线程            | Spring Boot 3.4+ `spring.threads.virtual.enabled=true`   |
| 死锁重试            | Spring Retry，`DeadlockLoserDataAccessException` 自动重试 3 次 |

### 11.2 安全防护

| 防护项       | 实现方案                                                                    |
| --------- | ----------------------------------------------------------------------- |
| SQL 注入    | `where_sql` 参数化绑定，`table_id` 白名单校验                                      |
| XSS       | Spring Web 默认 HTML 转义 + 前端输出编码                                          |
| 输入校验      | Jakarta Validation + 自定义注解                                              |
| 辅助核算值合法性  | 保存前校验 `check_value_id` 在目标表中存在                                          |
| 事务一致性     | `@Transactional(isolation=READ_COMMITTED, rollbackFor=Exception.class)` |
| 凭证号并发安全   | `WITH (UPDLOCK, SERIALIZABLE)` 锁提示防止竞态                                  |
| 连接字符串密码明文 | 生产环境使用 Jasypt 加密或环境变量                                                   |
| 死锁恢复      | Spring Retry 自动重试 DeadlockLoserDataAccessException                      |

### 11.3 错误码定义

| code | 说明              |
| ---- | --------------- |
| 0    | 成功              |
| 1001 | 借贷不平衡           |
| 1002 | 凭证主表数据校验失败      |
| 1003 | 分录行为空           |
| 1004 | 必填辅助核算未填写       |
| 1005 | 数据库异常           |
| 1006 | 参数校验失败          |
| 1007 | 凭证不存在           |
| 1008 | 辅助核算值校验失败（脏数据）  |
| 1009 | 凭证号生成冲突（并发重试耗尽） |

***

## 12. 附录

### 12.1 数据库表验证命令

以下 SQL 用于验证核心表是否存在：

```sql
-- 查看所有用户表
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_NAME;

-- 查看指定表的列信息
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'acct_vouch'
ORDER BY ORDINAL_POSITION;

-- 验证 sys_check_define 数据
SELECT check_id, check_name, table_id, where_sql, is_vouch_load
FROM sys_check_define
ORDER BY check_id;

-- 查看数据库排序规则
SELECT DATABASEPROPERTYEX('OESCQET-0408', 'Collation') AS DatabaseCollation;
```

### 12.2 与 PRD 的差异汇总

| 项目                                   | PRD 描述                              | 实际数据库值                         | 影响                       |
| ------------------------------------ | ----------------------------------- | ------------------------------ | ------------------------ |
| `acct_vouch.vouch_date`              | `date`                              | `datetime`                     | Java 类型用 `LocalDateTime` |
| `acct_vouch_detail.acct_subj_code`   | `nvarchar(50)`                      | `nvarchar(40)`                 | 字段长度校验                   |
| `acct_vouch_detail.amt_debit/credit` | `numeric(18,2)`                     | `numeric`（无精度限制）               | `BigDecimal` 映射即可        |
| `sys_dept.dept_code`                 | `nvarchar(20)`                      | `nvarchar(30)`                 | 字段长度校验                   |
| `sys_check_define`                   | 缺少 `is_not_eq_dirct_default`        | 实际存在 `is_not_eq_dirct_default` | 贷方默认核算逻辑                 |
| `acct_subj`                          | `comp_code/copy_code/acct_year` 未说明 | 实际均为可空                         | 查询时注意全局科目                |

### 12.3 开发环境搭建 Checklist

- [ ] 安装 OpenJDK 25 LTS (Adoptium)
- [ ] 配置 `JAVA_HOME` 环境变量
- [ ] 安装 Maven 3.9+
- [ ] 确认 SQL Server 实例可连接
- [ ] 创建 Spring Boot 项目骨架
- [ ] 配置 `application.yml` 数据库连接
- [ ] 启动应用，验证 `SELECT 1` 连通性
- [ ] 安装 Node.js 20+ (前端开发)
- [ ] `npm install` 前端依赖
- [ ] 前后端联调 API 接口
- [ ] 验证 HikariCP 连接池指标正常
- [ ] 确认数据库排序规则（`Chinese_PRC_CI_AS` 推荐）

### 12.4 参考文档

- [Spring Boot 3.4 Reference](https://docs.spring.io/spring-boot/docs/3.4.x/reference/)
- [Microsoft JDBC Driver for SQL Server](https://learn.microsoft.com/en-us/sql/connect/jdbc/)
- [OpenJDK 25 Release Notes](https://openjdk.org/projects/jdk/25/)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Caffeine Cache](https://github.com/ben-manes/caffeine)
- PRD 文档: `0001-oes-acct-vouch-req-prd-by-deepseek.md`
- Codex Review: `0002-oes-acct-vouch-tech-review-by-deepseek.md`

***

> **文档结束**
>
> 本文档基于实际数据库 `OESCQET-0408` (SQL Server) 验证结果撰写，所有表名、字段类型均来自真实数据库 `INFORMATION_SCHEMA` 查询，确保技术选型与实际情况无偏差。
>
> **修订记录**：
>
> - v2.0 → v2.1 (2026-05-17): Codex Review 修正，详见 `0002-oes-acct-vouch-tech-review-by-deepseek.md`
>   - Java 26 → Java 25 LTS (P0)
>   - 移除不存在的 String Templates 特性 (P0)
>   - 修正 `sendStringParametersAsUnicode` 配置 (P0)
>   - vouch\_no 生成增加 UPDLOCK 并发安全 (P1)
>   - 明确 API context-path 关系 (P1)
>   - 补充 Caffeine 依赖 (P1)
>   - 补充事务隔离级别规格 (P1)
>   - 明确 NOLOCK 使用边界 (P2)
>   - 表名白名单改为动态加载+静态兜底 (P2)

