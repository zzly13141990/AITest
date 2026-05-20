# oes-acct-vouch — 知识图谱分析报告

> **Project:** 望海康信 OES 会计凭证录入组件
> **Analysis:** understand-anything knowledge graph
> **Analyzed at:** 2026-05-18

***

## 1. 项目身份 (Project Identity)

| 属性        | 值                                                     |
| --------- | ----------------------------------------------------- |
| **名称**    | oes-acct-vouch                                        |
| **全称**    | OES Accounting Voucher Entry Component                |
| **组织**    | 望海康信 (ViewHigh) — OES (Operational Excellence System) |
| **工件 ID** | `com.oes.acct:oes-acct-vouch:1.0.0-SNAPSHOT`          |
| **核心能力**  | 会计凭证录入 — 支持动态辅助核算（多维度）的前后端组件                          |
| **端口**    | `http://localhost:83000/oes-acct-vouch`               |
| **数据库**   | SQL Server `OESCQET-0408` @ `127.0.0.1:1433`          |
| **路径**    | `AITest/code/w5/oes-acct-vouch`（注意：w5, 不是 m5）         |

***

## 2. 架构层 (Architecture Layers)

```
┌──────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                      │
│  React 18 + Ant Design 5 + Zustand 5                 │
│  VoucherEntryPage / DetailTable / CheckArea / ...    │
├──────────────────────────────────────────────────────┤
│              API GATEWAY (Axios)                      │
│  vouchApi.ts  ←→  http://localhost:83000             │
├──────────────────────────────────────────────────────┤
│           APPLICATION LAYER (Spring Boot)             │
│  Controllers → Services → Validators                 │
│  VouchCtrl / CheckCtrl / CascadeCtrl / NavCtrl      │
├──────────────────────────────────────────────────────┤
│           DOMAIN LAYER (Entities + DTOs)             │
│  AcctVouch / AcctVouchDetail / AcctCheckItem / ...  │
├──────────────────────────────────────────────────────┤
│        INFRASTRUCTURE / DATA ACCESS LAYER            │
│  Repositories (JdbcTemplate) + Cache + Config        │
│  DynamicSQLBuilder + SnowflakeIdGenerator            │
├──────────────────────────────────────────────────────┤
│              DATA STORE LAYER                         │
│  SQL Server (OESCQET-0408)                           │
│  acct_vouch → acct_vouch_detail → acct_check_items   │
└──────────────────────────────────────────────────────┘
```

***

## 3. 节点清单 (Node Inventory)

### 3.1 后端 Controller 层 (4 节点)

| 节点                     | 类型    | 职责              |
| ---------------------- | ----- | --------------- |
| `VouchController`      | class | 凭证 CRUD REST 端点 |
| `CheckController`      | class | 辅助核算查询 REST 端点  |
| `CascadeController`    | class | 辅助核算联动查询端点      |
| `NavigationController` | class | 凭证上/下翻页端点       |

### 3.2 后端 Service 层 (7 节点)

| 节点                        | 类型    | 职责               |
| ------------------------- | ----- | ---------------- |
| `VouchService`            | class | 凭证三表联保事务核心       |
| `CheckService`            | class | 科目辅助核算动态解析       |
| `CascadeService`          | class | 辅助核算联动值查询        |
| `CascadeCheckService`     | class | 复杂联动校验逻辑         |
| `NavigationService`       | class | 凭证浏览导航逻辑         |
| `OtherFzhsSettingService` | class | 其他辅助核算 (v2.1) 配置 |
| `VouchNoGenerator`        | class | Redis 分布式锁凭证号生成器 |

### 3.3 后端 Repository 层 (10 节点)

| 节点                         | 类型    | 职责                   | 操作表                            |
| -------------------------- | ----- | -------------------- | ------------------------------ |
| `VouchRepository`          | class | INSERT/UPDATE/SELECT | acct\_vouch                    |
| `VouchDetailRepository`    | class | INSERT/DELETE        | acct\_vouch\_detail            |
| `CheckItemsRepository`     | class | 批量 INSERT/DELETE     | acct\_check\_items (动态列)       |
| `CheckDefineRepository`    | class | 查询                   | sys\_check\_define             |
| `SubjRepository`           | class | 搜索/查询                | acct\_subj                     |
| `CheckAttrRepository`      | class | 查询                   | acct\_check\_attr              |
| `OtherFzSettingRepository` | class | 查询                   | acct\_subj\_other\_fz\_setting |
| `SysTableRepository`       | class | 查询                   | sys\_table                     |
| `VouchTypeRepository`      | class | 查询                   | acct\_vouch\_type              |
| `VouchNoSeqRepository`     | class | 查询                   | acct\_vouch\_no\_seq           |

### 3.4 后端 Entity 实体层 (9 节点)

| 节点                       | 类型    | 对应表                                        |
| ------------------------ | ----- | ------------------------------------------ |
| `AcctVouch`              | class | acct\_vouch 凭证主表                           |
| `AcctVouchDetail`        | class | acct\_vouch\_detail 分录表                    |
| `AcctCheckItem`          | class | acct\_check\_items 辅助核算（动态列 getter/setter） |
| `AcctSubj`               | class | acct\_subj 科目表                             |
| `SysCheckDefine`         | class | sys\_check\_define 核算定义                    |
| `AcctCheckAttr`          | class | acct\_check\_attr 关联配置                     |
| `AcctSubjOtherFzSetting` | class | acct\_subj\_other\_fz\_setting             |
| `AcctVouchType`          | class | acct\_vouch\_type                          |
| `AcctVouchNoSeq`         | class | acct\_vouch\_no\_seq                       |

### 3.5 后端 DTO/VO 层 (13 节点)

| 节点                                                                | 类型             | 用途            |
| ----------------------------------------------------------------- | -------------- | ------------- |
| `VouchSaveRequest` (内含 VouchMain + VouchDetail Record)            | class          | 保存请求          |
| `VouchLoadResponse`                                               | class          | 加载响应          |
| `ApiResponse<T>`                                                  | class          | 统一响应封装        |
| `SaveVouchResult`                                                 | class          | 保存结果          |
| `OperatorInfo`                                                    | class          | 操作人信息         |
| `SubjCheckConfig` (内含 CheckTypeInfo + OtherFzhsInfo)              | class          | 科目辅助核算配置      |
| `CheckOption`                                                     | class          | 辅助核算选项        |
| `NavigationRequest / NavigationResult`                            | class          | 导航请求/响应       |
| `CascadeCheckRequest / CascadeCheckResponse / CascadeValueResult` | class          | 联动查询          |
| `SysTableConfig`                                                  | class (Record) | sys\_table 配置 |

### 3.6 后端基础设施层 (10 节点)

| 节点                                     | 类型                  | 职责                         |
| -------------------------------------- | ------------------- | -------------------------- |
| `DynamicSQLBuilder`                    | class               | 动态 SQL 安全构建 + 表名白名单校验      |
| `SnowflakeIdGenerator`                 | class               | 雪花算法 ID 生成                 |
| `WhereSqlTemplate`                     | class               | where\_sql 模板解析            |
| `CheckDefineCache`                     | class               | 本地缓存 + 定时刷新 (5min)         |
| `AccountingStandardsValidator`         | class               | 会计准则校验                     |
| `ErrorCode`                            | enum                | 错误码枚举                      |
| `BusinessException`                    | class               | 业务异常                       |
| `GlobalExceptionHandler`               | class               | @RestControllerAdvice 全局处理 |
| `OptimisticLockException`              | class               | 乐观锁异常                      |
| `@OperationLog` + `OperationLogAspect` | annotation + aspect | AOP 操作日志                   |

### 3.7 前端节点 (12 节点)

| 节点                       | 类型              | 职责                    |
| ------------------------ | --------------- | --------------------- |
| `VoucherEntryPage`       | component       | 凭证录入主页面               |
| `DetailTable`            | component       | 分录编辑表格 (6 行最小 + 纵向滚动) |
| `CheckArea`              | component       | 辅助核算弹出选择区域            |
| `VouchForm`              | component       | 凭证主表头信息表单             |
| `NavigationBar`          | component       | 凭证导航栏                 |
| `SummaryBar`             | component       | 底部合计栏 (借方/贷方/中文大写)    |
| `AuxAccountingInfoTable` | component       | 辅助核算明细展示表             |
| `CashFlowInfoTable`      | component       | 现金流量展示表               |
| `StatusBar`              | component       | 状态栏                   |
| `vouchStore`             | store (Zustand) | 全局状态管理                |
| `vouchApi`               | api (Axios)     | HTTP 客户端封装 (10 接口)    |
| `vouch types`            | types           | TypeScript 类型定义       |

### 3.8 数据库表节点 (10 节点)

| 节点                           | 说明                                           |
| ---------------------------- | -------------------------------------------- |
| `acct_vouch`                 | 凭证主表 (vouch\_id PK)                          |
| `acct_vouch_detail`          | 凭证分录表 (一对多)                                  |
| `acct_check_items`           | 辅助核算表 (动态列 checktype1\~50 + info\_fzhs1\~5)  |
| `acct_subj`                  | 科目表 (check\_type1\~8 + other\_checktype1\~5) |
| `sys_check_define`           | 核算定义表 (check\_id + table\_id + where\_sql)   |
| `acct_subj_other_fz_setting` | 其他辅助核算配置                                     |
| `acct_check_attr`            | 辅助关联配置                                       |
| `sys_dept / sys_emp`         | 辅助核算档案表                                      |
| `up_org_user`                | 用户表 (操作人关联)                                  |

***

## 4. 关系边图谱 (Edge Graph)

### 4.1 核心调用边

```
VouchController
  └── calls → VouchService.loadVouch()
  └── calls → VouchService.saveVouch()
  └── calls → VouchService.getVouchTypes()
  └── contains → @OperationLog

VouchService
  └── calls → VouchRepository (insert/update/findById)
  └── calls → VouchDetailRepository (insert/deleteByVouchId)
  └── calls → CheckItemsRepository (batchInsert/deleteByVouchId)
  └── calls → CheckService.resolveSubjChecks
  └── calls → VouchNoGenerator.nextVouchNoWithLock
  └── calls → AccountingStandardsValidator.validate
  └── calls → SnowflakeIdGenerator (nextVouchId/nextDetailId)
  └── depends_on → JdbcTemplate

CheckService
  └── calls → SubjRepository.findByCode
  └── calls → CheckDefineCache.findByCheckName
  └── calls → DynamicSQLBuilder.buildQuerySQL
  └── calls → OtherFzSettingRepository.findVisibleBySubject
  └── depends_on → JdbcTemplate

CheckItemsRepository.batchInsert
  └── writes_to → acct_check_items (动态列 checktype1~50)

DynamicSQLBuilder.buildQuerySQL
  └── depends_on → SysTableRepository.findByTableId
  └── depends_on → WhereSqlTemplate.resolve
  └── validates → 表名白名单 (allowedTables)
```

### 4.2 前端 → 后端边

```
vouchStore (Zustand)
  └── calls → vouchApi.loadVouch()          → GET  /oes-acct-vouch
  └── calls → vouchApi.saveVouch()          → POST /oes-acct-vouch/save
  └── calls → vouchApi.getSubjChecks()      → GET  /oes-acct-vouch/subj/checks
  └── calls → vouchApi.searchSubjects()     → GET  /oes-acct-vouch/subj/search
  └── calls → vouchApi.getCheckOptions()    → GET  /oes-acct-vouch/check/options
  └── calls → vouchApi.navigate()           → GET  /oes-acct-vouch/navigation
  └── calls → vouchApi.cascadeCheck()       → POST /oes-acct-vouch/cascade-check
  └── calls → vouchApi.getVouchTypes()      → GET  /oes-acct-vouch/types
  └── calls → vouchApi.getTopSubjects()     → GET  /oes-acct-vouch/subj/top

vouchApi (Axios)
  └── routes → http://localhost:83000/oes-acct-vouch/*
```

### 4.3 数据库关系边

```
acct_vouch (1) ──contains──→ acct_vouch_detail (N)
acct_vouch_detail (1) ──contains──→ acct_check_items (N)
acct_subj ──defines_schema──→ 动态列 checktype{N}
sys_check_define ──configures──→ acct_subj.check_type{N}
acct_subj_other_fz_setting ──configures──→ acct_subj.other_checktype{N}
up_org_user ──reads_from──→ sys_emp ──reads_from──→ sys_dept
```

***

## 5. 核心架构决策 (Key Architecture Decisions)

| #     | 决策                             | 理由                                                          |
| ----- | ------------------------------ | ----------------------------------------------------------- |
| AD-1  | **全量替换保存策略** (DELETE + INSERT) | OES 行模型一对多，数据量小 (≤6行/分录)，性能可接受                              |
| AD-2  | **Java Record 用于 DTO**         | 不可变、紧凑构造器校验、Spring Boot 3.x 推荐                              |
| AD-3  | **构造器注入** (禁止 @Autowired 字段注入) | 显式依赖、方便测试                                                   |
| AD-4  | **DynamicSQLBuilder + 表名白名单**  | SQL 注入防护：表名必须通过白名单或 sys\_table 注册                           |
| AD-5  | **Caffeine 本地缓存 + Redis 分布式锁** | 本地缓存 (高频只读) + Redis (凭证号并发控制)                               |
| AD-6  | **Snowflake ID (非自增主键)**       | 避免依赖 SQL Server 自增，支持分布式                                    |
| AD-7  | **where\_sql 参数化解析**           | :compCode → ? 占位符，防止注入                                      |
| AD-8  | **6行最小行 + 滚动策略**               | ≤6行空白行，>6行表体纵向滚动                                            |
| AD-9  | **AOP 操作日志**                   | @OperationLog + Aspect 统一切面                                 |
| AD-10 | **前端 URL 参数驱动**                | compCode/copyCode/acctYear/acctMonth/account 从 URL query 传入 |

***

## 6. 核心数据流 (Data Flow)

### 6.1 凭证保存流

```
用户→保存
  → vouchStore.saveVouch()
    → vouchApi.saveVouch() POST
      → VouchController → VouchService.saveVouch()
        → AccountingStandardsValidator.validate()     ① 校验
        → VouchNoGenerator.nextVouchNoWithLock()      ② 凭证号 (Redis锁)
        → SnowflakeIdGenerator.nextVouchId()          ③ ID生成
        → VouchRepository.insert/update(acct_vouch)   ④ 主表
        → CheckItemsRepository.deleteByVouchId()      ⑤ 清旧
        → VouchDetailRepository.deleteByVouchId()
        → VouchDetailRepository.insert(分录行)        ⑥ 分录
        → CheckItemsRepository.batchInsert(辅助核算)  ⑦ 核算
        → Redis解锁
        → 返回 SaveVouchResult
```

### 6.2 辅助核算动态解析流

```
用户选择科目 "530101"
  → vouchApi.getSubjChecks({acctSubjCode:"530101"})
    → CheckService.resolveSubjChecks()
      → SubjRepository.findByCode → AcctSubj { checkType1="部门", ... }
      → CheckDefineCache.findByCheckName("部门") → checkId=1
      → CheckDefineCache.findByCheckName("项目") → checkId=32
      → OtherFzSettingRepository.findVisibleBySubject
      → 返回 SubjCheckConfig → 前端动态渲染
```

***

## 7. 游览路径 (Tour Steps)

按顺序阅读以下文件以理解完整系统：

| 步骤 | 文件                                                | 说明              |
| -- | ------------------------------------------------- | --------------- |
| 1  | `AGENTS.md`                                       | 编码规范 + 核心领域规则   |
| 2  | `docs/0001-oes-acct-vouch-req-prd-by-deepseek.md` | PRD 需求 — 理解业务背景 |
| 3  | `src/.../entity/*.java`                           | 9 个实体，理解数据结构    |
| 4  | `src/.../dto/VouchSaveRequest.java`               | 保存请求核心 DTO      |
| 5  | `src/.../service/VouchService.java`               | **核心** — 凭证三表联保 |
| 6  | `src/.../service/CheckService.java`               | **核心** — 辅助核算解析 |
| 7  | `src/.../util/DynamicSQLBuilder.java`             | 动态 SQL + 安全校验   |
| 8  | `src/.../repository/CheckItemsRepository.java`    | 动态列批量插入         |
| 9  | `src/.../cache/CheckDefineCache.java`             | 本地缓存 + 定时刷新     |
| 10 | `src/.../config/DataSourceConfig.java`            | 数据源配置           |
| 11 | `src/.../config/RedisConfig.java`                 | Redis 配置        |
| 12 | `src/main/resources/application.yml`              | 全部配置参数          |
| 13 | `frontend/src/store/vouchStore.ts`                | Zustand 状态管理    |
| 14 | `frontend/src/api/vouchApi.ts`                    | API 封装          |
| 15 | `frontend/src/components/DetailTable.tsx`         | 分录表格组件          |
| 16 | `frontend/src/components/CheckArea.tsx`           | 辅助核算弹窗组件        |
| 17 | `frontend/src/pages/VoucherEntryPage.tsx`         | 凭证录入主页面         |

***

## 8. 统计摘要

| 指标           | 数值     |
| ------------ | ------ |
| 后端 Java 文件   | \~40 个 |
| 前端 TSX/TS 文件 | \~12 个 |
| 配置/资源文件      | \~6 个  |
| 文档文件         | \~12 个 |
| 数据表          | \~10 张 |
| REST 端点      | 10 个   |
| 架构层          | 5 层    |
| 节点总数         | \~60+  |
| 核心边关系        | \~50+  |

***

## 9. 警告与关注点

- Java 26 + --enable-preview — 需要对应 JDK 版本 (目前最新 LTS 是 JDK 21)
- Spring Boot 4.0.6 是最新版，生态兼容性需验证
- application.yml 中 jdbc-url 属性名可能需根据版本调整
- SQL Server 依赖 OESCQET-0408 数据库，需确保表结构与代码匹配
- 路径注意：代码在 `w5` 下，不是 `m5`

***

## 10. 快速启动

### 后端启动 (Spring Boot)

在项目根目录执行：

```powershell
# 方式一：Maven 直接启动
cd D:\software\gitWorkspace\AI\AITest\code\w5\oes-acct-vouch && mvn clean package -DskipTests&&java -jar target/oes-acct-vouch-1.0.0-SNAPSHOT.jar --enable-preview

```

> **后端端口**: 8199（配置在 `application.yml`）

### 前端启动 (Vite)

在 `frontend` 目录执行：

```powershell
# 安装依赖并启动开发服务器（首次启动或 package.json 变更时）
cd D:\software\gitWorkspace\AI\AITest\code\w5\oes-acct-vouch\frontend&&npm install&& npm run dev
 
```

> **前端端口**: 默认 5173，被占用时自动切换（如 5174）

### 访问验证

启动成功后访问：

- **前端页面**: <http://localhost:5174> （或 Vite 输出的实际地址）
- **后端接口**: <http://localhost:8199>

***

## 11. 生产级打包与部署

### 11.1 后端打包 (Spring Boot)

#### 打包命令

```bash
# 完整打包（含测试）
mvn clean package

# 跳过测试快速打包
mvn clean package -DskipTests

# 产出物：target/oes-acct-vouch-1.0.0-SNAPSHOT.jar
```

#### Linux systemd 服务托管（推荐）

创建 `/etc/systemd/system/oes-acct-vouch.service`：

```ini
[Unit]
Description=OES Accounting Voucher Service
After=network.target sqlserver.service redis.service

[Service]
Type=forking
User=oes
Group=oes
WorkingDirectory=/opt/oes-acct-vouch

ExecStart=/usr/bin/java \
    -Xms2g -Xmx4g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+HeapDumpOnOutOfMemoryError \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.profiles.active=prod \
    -jar oes-acct-vouch-1.0.0-SNAPSHOT.jar

Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

systemd 命令：

```bash
systemctl daemon-reload
systemctl start oes-acct-vouch
systemctl stop oes-acct-vouch
systemctl restart oes-acct-vouch
systemctl status oes-acct-vouch
systemctl enable oes-acct-vouch  # 开机自启
journalctl -u oes-acct-vouch -f  # 实时日志
```

### 11.2 前端打包 (Vite + React)

#### 打包命令

在 `frontend` 目录执行：

```bash
# 安装依赖
npm install

# 生产打包
npm run build

# 本地验证打包结果
npm run preview

# 产出物：frontend/dist/
```

#### nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/oes-acct-vouch/dist;
    index index.html;

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    # BrowserRouter 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 后端 API 反向代理（解决跨域）
    location /oes-acct-vouch/ {
        proxy_pass http://127.0.0.1:8199;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 11.3 生产核心配置清单

| 维度        | 生产级要求                                |
| --------- | ------------------------------------ |
| **后端内存**  | `-Xms2g -Xmx4g`（根据物理内存调整）            |
| **GC 选择** | G1GC / ZGC（低延迟优先）                    |
| **进程托管**  | systemd / K8s Deployment（禁止 nohup &） |
| **日志路径**  | 外部统一目录，按天滚动                          |
| **前端缓存**  | nginx expires + ETag                 |
| **跨域**    | nginx 反向代理（不要在后端开 @CrossOrigin）      |
| **配置**    | `spring.profiles.active=prod`（外部配置）  |

***

> **Generated by understand-anything 知识图谱分析**

