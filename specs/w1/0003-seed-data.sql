/*
 * Project Alpha — 基础种子数据（SQL Server）
 * 依据：specs/w1/0001-spec.md 第 5.3 节表结构
 *
 * tag 15：ISO / Android / Windows 等体系与场景
 * ticket 500：中文模板轮换；标题/描述末尾加流水号，确保互不重复
 * ticket_tag：每条 ticket 1～4 个 tag（去重）
 *
 * 使用前 USE 目标库；会清空 ticket_tag / ticket / tag 并重置 IDENTITY。
 */

SET NOCOUNT ON;

-- USE project_alpha;

BEGIN TRANSACTION;

DELETE FROM ticket_tag;
DELETE FROM ticket;
DELETE FROM tag;

DBCC CHECKIDENT ('ticket', RESEED, 0);
DBCC CHECKIDENT ('tag', RESEED, 0);

/* ========== 15 个标签（平台 / 标准 / 场景） ========== */
INSERT INTO tag (name) VALUES
    (N'ISO 27001'),
    (N'Android'),
    (N'Windows'),
    (N'iOS'),
    (N'macOS'),
    (N'Linux'),
    (N'HarmonyOS'),
    (N'Ubuntu'),
    (N'Web'),
    (N'后端'),
    (N'前端'),
    (N'数据库'),
    (N'DevOps'),
    (N'安全'),
    (N'桌面端');

/* ========== 40 组中文标题 + 描述（500 条轮换；流水号保证标题与描述均唯一） ========== */
DECLARE @t INT = 1;
WHILE @t <= 500
BEGIN
    DECLARE @title NVARCHAR(255);
    DECLARE @descr NVARCHAR(MAX);
    DECLARE @ti INT = (@t - 1) % 40;
    DECLARE @di INT = ((@t - 1) * 7 + 11) % 40;

    SELECT @title = title FROM (VALUES
        (0,  N'修复 Android 端深色模式下表单对比度不足'),
        (1,  N'Windows 11 安装包在域控环境下的静默部署验证'),
        (2,  N'iOS 推送在证书轮换后偶发无法送达生产用户'),
        (3,  N'对照 ISO 27001 附录 A 补齐访问控制审计日志字段'),
        (4,  N'Linux 服务器时区与夏令时切换对定时任务的影响评估'),
        (5,  N'macOS 客户端与钥匙串集成的单点登录回归测试'),
        (6,  N'Ubuntu LTS 上容器镜像漏洞扫描流水线接入'),
        (7,  N'Web 端大列表虚拟滚动与可访问性键盘操作优化'),
        (8,  N'后端订单服务与支付网关签名校验失败率突增排查'),
        (9,  N'前端构建产物 Source Map 在生产环境的暴露策略评审'),
        (10, N'数据库主从延迟导致报表读旧数据的补偿方案'),
        (11, N'DevOps：生产发布窗口与灰度比例调整申请'),
        (12, N'安全：敏感接口缺少速率限制的风险整改'),
        (13, N'桌面端离线包自动更新与回滚机制设计'),
        (14, N'HarmonyOS 分包上架素材与隐私合规自检'),
        (15, N'Android 14 分区存储适配与文件选择器兼容'),
        (16, N'Windows 终端高 DPI 下图标模糊问题调研'),
        (17, N'iOS App Store 审核 2.1 条款被拒后的申诉材料准备'),
        (18, N'ISO 文档化：变更管理流程与发布记录模板统一'),
        (19, N'Linux 内核参数调优以缓解高并发连接 TIME_WAIT'),
        (20, N'macOS 公证（Notarization）失败日志分析与重提交流程'),
        (21, N'Ubuntu 上 .NET 服务与 systemd 托管配置规范化'),
        (22, N'Web 登录态跨子域共享与 Cookie SameSite 策略'),
        (23, N'后端批量任务幂等与死信队列监控告警'),
        (24, N'前端国际化文案漏翻与 RTL 布局抽检'),
        (25, N'数据库索引膨胀导致夜间备份超时扩容评估'),
        (26, N'DevOps：K8s 集群节点池自动伸缩阈值调优'),
        (27, N'安全渗透测试报告中等风险项修复排期'),
        (28, N'桌面端与 Web 端配置同步冲突解决策略'),
        (29, N'Android 通知渠道分类与用户可关闭项梳理'),
        (30, N'Windows 组策略限制下浏览器自动更新策略说明'),
        (31, N'iOS Widget 在低内存设备上的崩溃率监控'),
        (32, N'Linux 文件描述符上限与中间件连接池对齐'),
        (33, N'WebSocket 长连接在网关超时后的重连退避策略'),
        (34, N'后端 OpenAPI 契约与前端类型生成的版本对齐'),
        (35, N'前端性能：首屏 LCP 与资源优先级调整实验'),
        (36, N'数据库归档表分区方案与查询改写'),
        (37, N'DevOps：制品库保留策略与磁盘容量预警'),
        (38, N'安全：第三方 SDK 供应链清单与许可证审计'),
        (39, N'桌面端崩溃转储符号表上传与符号化流水线')
    ) AS Titles(idx, title)
    WHERE idx = @ti;

    SELECT @descr = descr FROM (VALUES
        (0,  N'设计已评审，开发与测试按清单逐条验收，预计本迭代关闭。'),
        (1,  N'需在测试域复现后输出根因，涉及厂商补丁的需走变更流程。'),
        (2,  N'已联系业务方确认影响面，优先保障核心省份用户可用性。'),
        (3,  N'对照检查表逐项截图留痕，缺口项列入下季度内审观察项。'),
        (4,  N'运维侧提供近三月 crontab 与日志样本供研发分析。'),
        (5,  N'回归用例覆盖 Ventura / Sonoma 两个主要版本。'),
        (6,  N'镜像源切换至内网仓库，扫描规则与阻断策略同步更新。'),
        (7,  N'与无障碍顾问走查一轮，修复焦点陷阱与语义标签问题。'),
        (8,  N'比对近七日网关日志与商户侧时间戳，排除时钟漂移。'),
        (9,  N'结论写入前端工程规范，CI 增加上传前校验脚本。'),
        (10, N'短期读主兜底开关已加，长期推进读写分离路由改造。'),
        (11, N'发布负责人确认窗口与回滚预案，公告提前一日发出。'),
        (12, N'限流与封禁策略在预发压测验证，监控大盘已配置。'),
        (13, N'产品确认用户可见的更新说明与失败重试文案。'),
        (14, N'法务与应用商店运营联合核对权限声明与截图。'),
        (15, N'兼容 Android 12–14，低端机专项测试十款机型。'),
        (16, N'收集用户分辨率分布，优先修复 125%/150% 缩放场景。'),
        (17, N'整理被拒条款对应功能说明与后续合规改造计划。'),
        (18, N'模板发布后培训各部门接口人，试运行一个月收集反馈。'),
        (19, N'变更经架构评审，灰度一台机器观察 48 小时指标。'),
        (20, N'Apple 后台票据与本地 stapler 日志一并归档备查。'),
        (21, N'统一 Environment 与 Restart 策略，文档更新至运维手册。'),
        (22, N'与 SSO 团队确认 IdP 配置与登出串联行为。'),
        (23, N'监控面板增加堆积深度与消费延迟告警阈值。'),
        (24, N'翻译供应商补充词条，RTL 在阿拉伯语环境手测通过。'),
        (25, N'评估在线重建与迁移窗口，业务低峰期执行。'),
        (26, N'结合业务峰值曲线调整 HPA 上下限与冷却时间。'),
        (27, N'修复排期与责任人已录入缺陷平台，周会跟踪。'),
        (28, N'采用「以服务端为准」策略并增加冲突提示 UI。'),
        (29, N'默认渠道与营销类通知分离，避免用户一键全关。'),
        (30, N'输出 IT 与终端用户两版说明文档，附组策略键值。'),
        (31, N'与崩溃平台打通符号表，按版本聚类 Top 问题。'),
        (32, N'中间件与 OS ulimit 取较小值，配置即代码入库。'),
        (33, N'客户端实现指数退避，服务端记录重连频次防刷。'),
        (34, N'breaking change 走版本号与公告双通道告知调用方。'),
        (35, N'实验组 5% 流量，关注 CLS 与 INP 是否回退。'),
        (36, N'历史数据迁移脚本可重入，校验行数与 checksum。'),
        (37, N'超期制品自动清理，重要版本打永久保留标签。'),
        (38, N'法务清单与 SBOM 导出纳入发版检查项。'),
        (39, N'符号服务器权限收紧，仅 CI 与值班账号可写。')
    ) AS Descs(idx, descr)
    WHERE idx = @di;

    SET @title = @title + N'（流水' + CAST(@t AS NVARCHAR(10)) + N'）';
    SET @descr = @descr + N'【追踪号 ' + CAST(@t AS NVARCHAR(10)) + N'】';

    INSERT INTO ticket (title, description, completed, created_at, updated_at)
    VALUES (
        @title,
        @descr,
        CASE WHEN (@t * 17 + 3) % 11 = 0 THEN 1 ELSE 0 END,
        DATEADD(MINUTE, -@t, SYSUTCDATETIME()),
        DATEADD(MINUTE, -(@t / 2), SYSUTCDATETIME())
    );

    SET @t += 1;
END;

INSERT INTO ticket_tag (ticket_id, tag_id)
SELECT DISTINCT t.id, x.tag_id
FROM ticket AS t
CROSS APPLY (VALUES
    (1 + (t.id % 15)),
    (1 + ((t.id * 3) % 15)),
    (1 + ((t.id * 7) % 15)),
    (1 + ((t.id * 13) % 15))
) AS x (tag_id)
WHERE x.tag_id BETWEEN 1 AND 15;

COMMIT TRANSACTION;
