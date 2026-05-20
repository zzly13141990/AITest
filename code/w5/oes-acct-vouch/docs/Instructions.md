# Instructions

## 构建 OES 凭证组件

一、业务背景
需开发符合望海康信 OES 系统标准的会计凭证录入前端 + 后端组件，核心支持会计科目多辅助核算自动匹配、弹窗选择、分录绑定、辅助核算数据落地保存，严格遵循 OES 原生凭证录入业务逻辑与表结构规范。
二、涉及数据库表结构及核心关联规则

1. 涉及核心数据表
   acct\_vouch：凭证主表
   acct\_vouch\_detail：凭证分录明细表
   acct\_check\_items：辅助核算明细存储表
   acct\_subj：会计科目基础表
   sys\_check\_define：系统辅助核算定义配置表
   up\_org\_user ：用户信息表
   sys\_emp ：员工信息表
   sys\_dept ：部门信息表
2. 核心业务匹配规则（关键逻辑必须严格遵守）
   从会计科目表 acct\_subj 读取科目对应的辅助核算类型字段：check\_type1、check\_type2...（如值为「部门」「项目」「供应商」「员工」等文本名称）。
   拿着 acct\_subj 里的辅助核算名称（如check\_name='部门'、check\_name='项目'），去辅助核算信息表 sys\_check\_define 匹配对应记录。
   从 sys\_check\_define 取出字段：table\_id、whereSql，拼接成可执行 SQL，查询出当前辅助核算的可选下拉 / 弹窗选项数据源。
   sys\_check\_define 中每条辅助核算定义对应唯一 check\_id（示例：部门 check\_id=1、项目 check\_id=32）。
   保存入库规则：
   选中的辅助核算值，不存固定字段，而是按 check\_id 动态存入 acct\_check\_items 表对应 checktype+check\_id 字段；
   例：
   科目辅助核算类型为「部门」→ 匹配 sys\_check\_define 得到 check\_id=1 → 保存到 acct\_check\_items.checktype1
   科目辅助核算类型为「项目」→ 匹配 sys\_check\_define 得到 check\_id=32 → 保存到 acct\_check\_items.checktype32
   三、组件功能要求
   凭证主表 + 分录表常规信息录入；
   分录行选择会计科目后，自动解析该科目绑定的所有辅助核算类型；
   动态生成对应辅助核算录入项（弹窗选择 / 下拉选择）；
   根据 sys\_check\_define 的 table\_id + whereSql 动态加载辅助核算可选档案数据；
   支持多辅助核算同时录入，不限个数；
   凭证保存时，自动将各辅助核算值按 check\_id 映射，存入 acct\_check\_items 对应动态字段；
   完全适配望海康信 OES 系统凭证录入原生逻辑，字段映射、取值、入库规则严格对齐现有 OES 标准。
   四、你需要帮我输出内容
   后端：表关联查询 SQL、科目辅助核算解析逻辑、动态拼接辅助核算数据源 SQL、凭证保存事务逻辑（主表 + 分录 + 辅助核算三张表联动入库）；
   前端：凭证分录行动态渲染多辅助核算录入控件、根据科目自动带出对应核算项、选择后回显、表单校验；
   输出清晰的字段映射关系、伪代码 / 完整业务代码、注释说明，严格按上面 OES 辅助核算规则实现，不得自定义修改映射逻辑。
   根据这些需求帮我构建一个详细的需求文档，先不要着急去做设计，等我review完这个需地文档后，我们再讨论设计，文档放在 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deeptseek.md
   基于以上要求出具的需求文档， 调用codex review skill 让 codex review 这个需求文档，并更新文件，reivew 是否符合望海康信 OES 系统标准。
   基于 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek.md 需求，设计该组件提供接口地址，用于前端调用，接口地址为：<http://localhost:83000/oes-acct-vouch> 并需要传递主表vouch\_id,当前操作人账号，comp\_code,copy\_code,acct\_year。
   组件会根据vouch\_id查询凭证主表，将查询结果返回给前端。
   组件会根据当前操作人账号，查询当前操作人所属的部门，将部门信息返回给前端。
   组件会根据当前操作人账号，查询当前操作人所属的员工，将员工信息返回给前端。
   请根据上述需求，设计组件的接口文档,并更新到 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek.md 文件，要求：接口文档要符合望海康信 OES 系统标准，并同时使用review 整个文档进行审查，必要时可以使用mermaid chat来辅助描述，，确保文档符合 OES 系统标准，将审查结果更新到 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek-review\.md 文件中，之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件。

## 补充需求

基于 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deeptseek.md 需求，设计该组件提供接口地址，用于前端调用，接口地址为：<http://localhost:83000/oes-acct-vouch> 并需要传递主表vouch\_id,当前操作人账号，comp\_code,copy\_code,acct\_year。
组件会根据vouch\_id查询凭证主表，将查询结果返回给前端。
组件会根据当前操作人账号，查询当前操作人所属的部门，将部门信息返回给前端。
组件会根据当前操作人账号，查询当前操作人所属的员工，将员工信息返回给前端。
请根据上述需求，设计组件的接口文档,并更新到 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek.md 文件，必要时可以使用mermaid chat来辅助描述，要求：接口文档要符合望海康信 OES 系统标准，并同时使用review 整个文档进行审查，确保文档符合 OES 系统标准，将审查结果更新到 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek-review\.md 文件中，之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件。

## 补充需求2-其它辅助核算添加

我更新了 ./AITest\specs\w5\oes-acct-vouch\table 目录下的文件，里面添加了两个表：
acct\_subj\_other\_fz\_setting : other\_checktype1-5配置表(input\_type 为3：文本框输入  4：字典选择录入)
acct\_check\_attr : 辅助关联选择配置，即：选择了一个字典，另一个辅助核算自动选择对应的值。

根据以上，还有几个问题
1、acct\_vouch\_detail和acct\_check\_items 是一对多的关系
2、在acct\_subj表中有other\_checktype1-5  这几个列，也要加在辅助核算选择里，对应acct\_check\_items表的info\_fzhs1-5 如acct\_subj表里的是other\_checktype1-5存在日期、结算方式​、票据号​、回单号 时，需要写入acct\_check\_items表对应的info\_fzhs1-5，同时还要写入如下：
日期->acct\_check\_items表的order\_date和occur\_date 没有时默认写入凭证日期
结算方式->acct\_check\_items表的 pay\_type\_id
票据号 -> acct\_check\_items表的 cheq\_no和order\_no

请根据以上需求进行分析，然后更新 AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-prd-by-deepseek.md需求文档和
AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-design-by-deepseek.md设计文档

然后分别利用Codex review对该两个文件进行review ，将结果更新至：AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-prd-by-deepseek-review\.md需求文档 以及
AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-design-by-review-deepseek.md设计文档中
，最后仔细阅读review结果，思考是否合理，然后相应地更新文件 ，必要时可以使用mermaid chat来辅助描述。

新增acct\_subj.other\_type1-5 中 ='票据号' 时，写入到acct\_check\_items表中对应的info\_fzhs中，同时写入到cheq\_no，order\_no。。请注意：票据号  和回单号  是两个概念。请以此，修改prd文档和设计文档。 然后重新对prd文档,设计文档进行codex review，将结果同步更新到对应的reivew文件中，再考虑合理性，写入prd,设计文档。可以使用mermaid chat来辅助描述。

## 技术选型

请根据 ./AITest/specs/w5/oes-acct-vouch/0001-oes-acct-vouch-req-prd-by-deepseek.md 需求，重新做技术选择，要求：maven java  openjdk26 ，数据库使用 sqlserver,连接地址为 jdbc:sqlserver://127.0.0.1:1433;databaseName=OESCQET-0408;user=sa;password=zz，将技术选择结果更新在 ./AITest/specs/w5/oes-acct-vouch/0002-oes-acct-vouch-tech-by-by-deepseek.md 文件中。关于表名验证，自行连接数据库查询 ，必要时可以使用mermaid chat来辅助描述。

## 构建设计文档

根据 ./AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-prd-by-deepseek.md 方档，构建 oes-acct-vouch的设计文档，文档放在
./AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-design-by-deepseek.md 文件中，必要时可以使用mermaid chat来辅助描述。think ultra hard

## codex review design documen

调用 codex review skill 让codex review  ./AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-design-by-deepseek.md 文件，将review结果更新至 ./AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-design-by-review-deepseek.md 文件中。之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件 ，必要时可以使用mermaid chat来辅助描述。

## AGENTS.md 生成

为 ./AITest/specs/w5/oes-acct-vouch   生成 AGENTS.md 。 要求：代码要符合java best practice /idomatic java,符合 SOLID/DRY 等设计思路，代码质量和测试质量要高，性能要好。生成好后，同步复制一份到 ./AITest/code/w5/oes-acct-vouch 目录下

## 生成 plan

eepseek.md 文件中 ，必要时可以使用mermaid chat来辅助描述。
生成完文件后，调用codex review 对生成的计划markdown文件进行审查,审查结果放在 ./AITest/specs/w5/oes-acct-vouch/0003-oes-acct-vouch-plan-revie-deepseek.md，之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件，think ultra hard。

## 实现代码plan

根据 AITest\specs\w5\oes-acct-vouch\0001-oes-acct-vouch-req-prd-by-deepseek.md 和 AITest\specs\w5\oes-acct-vouch\0002-oes-acct-vouch-tech-by-by-deepseek.md以及 ./AITest\specs\w5\oes-acct-vouch\0003-oes-acct-vouch-req-design-by-deepseek.md  和./AITest/specs/w5/oes-acct-vouch/0003-oes-acct-vouch-plan-by-deepseek.md 文档，使用子代理完整实现 oes-acct-vouch 所有阶段开发，
代码放在：./AITest/code/w5/oes-acct-vouch 目录下。
代码实现完后调用 Codex Review技能让Codex Review 对整个代码进行审查，以检查其是否符合设计和实现计划。将审查结果写入./specs/w5/oes-acct-vouch/0005-oes-acct-vouch-impl-plan-review\.md 文件中 ，之后仔细阅读 review 的结果，思考是否合理，然后相应地更新文件和修正代码。

## 细节修改

./AITest/code/w5/oes-acct-vouch 项目前端请求后端时，compCode,copyCode,acctYear 参数是固定的，请修改成动态的，我进入页面时，会传入compCode,copyCode,acctYear,acctMonth,account参数，另外在录入凭证页面，制单人是固定死的，应该是我传入的参数account去查对应的职工姓名显示出来，在首页，不显示取消/取消1/草稿/等按钮，只保存与保存/打印相关的按钮。不要打印设置，将凭证字/凭证日期/状态，附单据  单放一行。 凭证录入页面，当编辑列（增行/删行）显示出来时,整个表会闪烁、请将表格body行高调整到 60px，里面的编辑框占满单元格，行号的列，缩小到能支持4位数的列宽，将编辑列显示到行号前面，宽度固定成显示出一个图标的宽度，将增加/删除图标纵向排列。
当表体行数增多到一定层度后，会显示出页面滚动行，不要页面滚动行，当分录数超过6行时，表体内显示纵向滚动，滚动时，列头不动，表体内容进行上下滚动。

凭证录入表格，最多显示6行，超过6行时，表体内显示纵向滚动，不超过6行时，不显示滚动条，并补充空白行。
行号列：请居中显示。摘要，科目，金额列按ESC或点击别的区域可退出编辑状态。其中摘要列录入时可自动换行。
请针对该项目，添加日志记录， 记录用户操作，包括登录，退出，录入凭证，查询凭证，打印凭证，保存凭证等， 操作时间，操作人，操作内容，操作结果等，同时log日志级别为info 还需要打印出SQL语句，方便调试。

点击科目编辑，科目列的宽度变大了，点击摘要编辑，摘要列变长了，请修改，列宽度不变。检索科目时，不灵敏，反应慢，请修复或用别的方式加载，让检索不卡顿。附单据/状态靠最右侧显示，记账凭证四个字与凭证字，附单据合成一行，记账凭证在中间，字体不变。当我录入超长的摘要时，录入时换行了，但点击回车后，摘要摘要单元格回填的内容没有自动换行，只在第一行后显示了省略号，要求换行，当高度展示不了后在能显示的最后一行后面+省略号，请修改。科目选择后，选中后回填科目代码+名称（如530101 资产处置费用-库存物品)
选择完科目后，应该立即判断是否存在辅助核算和其它辅助，如果有，应该在紧挨着科目录入框下方弹出层展示并录入或选择辅助核算或其它辅助。不应该在表格下方展示。

## 细节修改2

./AITest/code/w5/oes-acct-vouch 项目前端，当我点击表体某一行时，下方会展示出该行的辅助核算信息表格，包括：
辅助核算摘要/辅助核算项目/辅助核算金额
当没有选择或点击任何分录时，显示现金流量的表格，包括：
现金流量摘要/现金流量项目/现金流量金额
金额区域：请与表格展示为一体，固定在表尾，借方合计/贷方合计 与列对齐，“合计”固定字符占两列（操作列和行号列），摘要和科目列合并，当借方金额=贷方金额时 显示 借方金额的 中文大写，否则显示 差额的 中文大写并用红色字体显示。
借方金额/贷方金额列 规则：金额为正数时，正常显示，金额为负数时，用红色字体显示。
摘要列录入时不可换行，但录入字符数很长，需在表格内换行显示，如超过单元格高度，需在最后一行后面展示一个省略号，鼠标移到该单元格时，显示完整的摘要内容。
科目列录入时不可换行，但选择的科目字符很长时，需在表格内换行显示，如超过单元格高度，需在最后一行后面展示一个省略号，鼠标移到该单元格时，显示完整的科目内容。科目内录完辅助核算后，需在科目列中，展示辅助核算内容，如：5001010101 资产负债-1213123123【辅助核算编码1-辅助核算名称1】【辅助核算编码2-辅助核算名称2】。当我点击科目列时，进入编辑时不体现科目单元格内加的辅助核算文本。点击科目进入编辑时，按compCode,copyCode,acctYear加载前50个科目，按acct\_subj\_code进行排序。凭证字：改成下拉，可编辑，数据表我放到了：AITest\code\w5\oes-acct-vouch\docs\table   acct\_vouch\_type: 凭证字字典 新增进入时，默认第一个选项，并可选其它，不能手工输入筛选。

在科目列下时，如没有选择科目，按ESC或鼠标点击别处时，可以取消选择,摘要/借贷方金额同理。

## 细节修改3

现金流量信息/辅助核算信息 展示时，表格高度自动适应剩下的表格空间，如数据条数超过显示行数，则需要展示滚动条，滚动时，列头不动，表体内容进行上下滚动。
最后一行制单人列删除。主管/记账人/审核人那一行，显示在现金流量/辅助核算信息的上方一行。
保存时，如有分录没有录入科目和金额列，则排除该分录，不进行保存，同时添加校验如下：
已经录了金额，没有录科目或摘要的分录，提示用户录入科目或摘要。
经录了科目，没有录辅助核算(acct\_subj表中的checktype1-8对应的辅助核算是必填的)/其它辅助核算(acct\_subj表中的other\_checktype1-8对应的其它辅助核算是否必填/编辑类型 是按照acct\_subj\_other\_fz\_setting表的数据来判断)的分录，提示用户录入辅助核算/其它辅助核算。
校验整个凭证是否符合会计规则，如借方金额=贷方金额，提示用户录入的金额不符合会计规则，是否借贷不平等。

## 细节修改4

./AITest/code/w5/oes-acct-vouch 主页中加载出来的辅助核算下拉列表选项没有选项，请修复。当科目编辑取消时，辅助核算/其它辅助核算下拉列表或日期选择等选项也应取消。如当前行科目已经录入了辅助核算时，在科目编辑时，点击回车后，辅助核算/其它辅助核算 值应该自动带入，如辅助核算/其它辅助有多条时，应该弹出层，展示一个页面列表，辅助核算信息，上方展示：科目代码+名称 ，分录金额/辅助金额合计，下方展示表格，表格列如下：
辅助核算摘要  辅助核算1/其它辅助   金额
支持批量修改，导入，导出Excel，点击确认后，向凭证录入主页表格行写入数据，在科目处展示辅助核算/其它辅助核算 相关信息，在主页点击保存时，将辅助核算/其它辅助核算 相关信息 也写入数据库。
凭证录入主页，科目列选项应该展示 acct\_subj\_code+' '+acct\_subj\_name\_all ，选择完科目后，回写也是。
选择完科目后，应该立即关闭下拉选项，再判断是否存在辅助核算和其它辅助，如果有，应该在紧挨着科目录入框下方弹出层展示并录入或选择辅助核算或其它辅助。

## 细节修改5

./AITest/code/w5/oes-acct-vouch 项目中，查询辅助核算列表时，添加规则如下：
sys\_table表结构已经放到了AITest\code\w5\oes-acct-vouch\docs\table 目录下面了
在sys\_check\_define表得到table\_id后，需要查询sys\_table表的table\_id，查询到对应的id\_field,code\_field,name\_field来显示，同时table\_level值为2时代表单位级，在拼接sql时需要加上comp\_code的
条件，如果table\_level=3 代表账套级，需要拼接copy\_code参数，如果is\_year为1 并且 year\_field有值，则还需要拼接 year\_field  对应acctYear的值
如果sys\_table表中没有配置stop\_field,则不需要加is\_stop的条件，如果没有配置is\_last\_field  则不需要加 is\_last='1'

## 细节修改2

./AITest/code/w5/oes-acct-vouch 项目中
1、科目选择时，用鼠标点击下拉列表内容选择或回车选择，都可以弹出辅助核算选择。
2、将科目录入完后，弹出辅助核算信息层，辅助核算/其它辅助核算选项排版进行调整，一行只有一个辅助核算，将辅助核算标题，与第二行对齐，剩余宽度，下拉/录入框自适应。
3、弹出辅助核算信息层时，光标默认在第一个辅助核算/其它辅助 内。如第一个是下拉，则展示出下拉列表，进行选择，鼠标点击选项，或回车选择后，进入第二个辅助下拉或录入框，如是下拉，则展示出来。
4、到最后一个辅助核算，如是下拉，鼠标点击或回车选择后进入到贷方金额/贷方金额区域，如分录行这一行中 借方金额和贷方金额 都没有录入值或没值，则进入借方金额，或这借方金额有值，则进入借方金额，如贷方金额有值，则进入贷方金额。
5、借方金额录入值后。回车，回写值后，自动进入到下一行的摘要，如下一行摘要没有值，则将上一行的摘要复制到本行。
6、去掉凭证录入，最下方一行 （制单人，部门，员工，帐号）。
7、将主管，记账人，审核人，制单人，财务 预算 分类数 调整到挨着录入表格的下方
9、预算分类数 改成预算分录数
10、借方金额，贷方金额  只能一方有值，如在借方金额处填写了金额，自动清空贷方金额值。在贷方金额处填写了金额，自动清空借方金额。
11、在借方金额或贷方金额处录入=号时，自动找平金额，并写入到录入框中。
12、辅助核算信息列表显示不对，当我录入500101010101科目后，下方的辅助核算信息展示区域应该是：
摘要   部门   资金来源   人员类别   金额
以列展示辅助核算或其它辅助核算分类。

主页中，主管，记账人，审核人的取值如下：
1、主管 如是新增：取 up_org_unit 表的acc_manager字段值，该值存的就是中文，直接显示 如是修改：取acct_vouch 表中的acc_manager字段值，直接显示 。
2、记账人 取 acct_vouch 表中的 poster 字段，直接显示，如没值：显示空字符串。
3、审核人 取 acct_vouch 表中的 auditor 字段，直接显示，如没值：显示空字符串

主页中，关于分录表格的样式如下：
1、如当前行分录的科目是财务科目(acct_subj表中的is_budg=0)，当前行背景颜色 显示一个颜色。
2、如当前行分录的科目是预算科目(acct_subj表中的is_budg=1), 当前行背景颜色 显示另一个颜色。
## 细节修改3

./AITest/code/w5/oes-acct-vouch 项目中
凭证录入保存时，校验
1、已经录了金额，没有录科目或摘要的分录，提示用户录入科目或摘要。
2、经录了科目，没有录辅助核算(acct\_subj表中的checktype1-8对应的辅助核算是必填的)/其它辅助核算(acct\_subj表中的other\_checktype1-8对应的其它辅助核算是否必填/编辑类型 是按照acct\_subj\_other\_fz\_setting表的数据来判断)的分录，提示用户录入辅助核算/其它辅助核算。
3、校验整个凭证是否符合会计规则，如借方金额=贷方金额，提示用户录入的金额不符合会计规则，是否借贷不平等。

按钮栏添加 按钮“辅助核算”，我点击一行分录后，点击辅助核算按钮时，弹出层如下：
科目：acct\_subj\_code+' '+acct\_subj\_name\_all  分录金额：XXXXXXXXXXXX.XX  辅助核算总金额：XXXXXXXXXX.XX
摘要   辅助核算名称(如:部门)  辅助核算名称(如:资金来源)  其它辅助核算名称(如：到期时间)   其它辅助核算名称（如：票据号） 金额

该弹出层，功能如下：
1、可以在表格内直接编辑，如点击的那条分录已经存在了辅助信息，需加载到表格内。
2、可以导入Excel功能，导入 摘要，辅助核算信息，金额到表格内。
3、添加确认按钮，点击后，校验如下：
1、如填写了辅助核算信息或金额，没有填写 摘要，提示摘要不能为空。
2、如填写了摘要，金额，存在某一类或全部 辅助核算信息 没填，提示对应的辅助核算信息不能为空（注：other\_checktype1-8对应的其它辅助核算是否必填/编辑类型 是按照acct\_subj\_other\_fz\_setting表的数据来判断）。
3、如填写了任一类辅助核算信息，金额没写，则提示金额不能为空。
校验通过后，写入到该分录的结构中，关闭弹出层。
在凭证点击保存时，需要将对应的多行辅助核算信息写入传入后台，写入到数据库中。


## 细节修改4-辅助核算按钮功能。
点击 辅助核算 按钮，弹出层如下：
1、要将当前分录行的摘要，金额也传递进去，填入到弹出层的摘要，金额区域。
2、表格内，所有列宽要自适应，可以换行显示，最多显示2行，大于2行的，用省略号表示。
3、表格内，进入编辑模式后，所有编辑框/下拉框，都要占满单元格。
4、表格内，辅助核算/其它辅助核算，如果编辑模式是下拉，下拉结果的宽度要展示全，现在只展示了部份，需要调整下拉结果的宽度，展示全。
5、弹出的层，高度要加高，宽度要加宽，弹出的层，要支持拉大，拉小，全屏，恢复到正常大小。
6、弹出的层，高度要适应层内表格数据最少10行的数据。如没有10行数据，补充空白行。
7、表格内，所有行的高度要固定，每一行的高度要支持单元格内跨行展示（2行）。
8、表格内，支持多选，用户可以多选后，进行批量修改或删除辅助核算，如批量修改摘要，批量修改金额，批量修改辅助核算信息等。
9、表格内的所有单元格，都需要支持编辑。（以多类辅助信息一条，多条辅助核算信息的方式进行编辑和最后的保存）
10、表格内，有有单元格，回车时，自动进入下一个单元格，在金额单元格回车时，自动进入下一行的摘要单元格编辑。

## 保存取acct_year,acct_month字段值以及判断期间是否已经结账
凭证保存时：所有的acct_year,acct_month字段取凭证日期 的年和月 
注：月份不足两位时，要前补0

凭证保存时：
1、验证凭证日期所在期间是否已经结账(根据vouch_date去查acct_year_period表与begin_date end_date，在当时间范围内的，acc_
flag等于0就表示在没有结账，acc_
flag=1则表示已经结账并给提示：XXXX年XX月已经结账，禁止录入凭证，如果没有查到，则提示：未发现凭证日期对应的期间，请联系管理员！
)。
2、所有的acct_year,acct_month字段 取值规则：根据vouch_date查询acct_year_period表，判断是否在begin_date end_
date范围，然后取对应acct_year_period 记录的acct_year,acct_month
注：月份不足两位时，要前补0

## 金额=号找平功能优化
1、在金额处，录入=号时，自动将金额找平到所有分录中（注：如该分录是财务分录acct_subj.is_budg=0，则对财务分录金额进行找平。如该分录是预算分录acct_subj.is_budg=1，则对预算分录金额进行找平，如该分录未录入科目，不进行找平）。
2、保存时，校验借贷不对，根据财务科目，预算科目，分类进行校验。

## 点击辅助核算按钮 功能优化
点击 辅助核算 按钮，弹出层时，
1、需要将分录的摘要，金额传入到层中，如辅助核算记录条数只有一条时，自动填入到弹出层的摘要列，金额列。
2、录入对应数据后，点击确认，需要回写到当前分录的结构中，同时需要将辅助核算总金额也回写到当前分录的金额中（注：如分录借方金额有值，则将辅助核算总金额回写到借方金额，如贷方金额有值，则将辅助核算总金额回写到贷方金额，如都没有值，则同样写入借方金额中）。

## 添加保存/取草稿功能
./AITest/code/w5/oes-acct-vouch 项目中
1、点击保存草稿按钮,弹出层，录入草稿名称，录入完后，将当前凭证的分录信息，保存到草稿表中。
2、草稿表中，草稿表对应表名如下：acct_vouch_draft  acct_vouch_detail_draft acct_check_items_draft (草稿表的辅助核算/其它辅助核算 的处理方式与acct_check_items一致) 表结构放在了./AITest/code/w5/oes-acct-vouch/docs/ 
3、保存草稿时，不做任务校验，直接保存。
4、添加取草稿功能，点击取草稿按钮，弹出层，显示草稿列表（可单选），显示字段：草稿名称，草稿创建时间，草稿创建人。可选择草稿，点击确认，将草稿的凭证信息，分录信息，辅助核算信息，加载到当前凭证中。
5、在草稿列表页面，可以点击草稿名称进入到草稿凭证查看（功能与凭证查看相同，点击保存时，需要将草稿的分录信息，辅助核算信息，写入到数据库中）。也可以选中一行草稿，点击删除，删除该草稿（删除时需要删除草稿主表，草稿分录表，草稿辅助核算表）。
6、空行不保存（摘要/科目/借贷方金额 都没有值时）
7、取草稿加载时，如当前凭证分录行有数据，则提示用户，让用户确认是替换还是追加。
8、从草稿列表点击草稿名称进入查看时，用户可以跟正式凭证一样编辑，但是最后保存时，是存到草稿表，不操作正式表（这个功能就是修改
草稿表内容）
9、acct_vouch_draft表主键 vouch_id 用数据库自增，acct_vouch_detail_draft也是用数据库自增，acct_check_items主键
也是用数据库自增

## 凭证数据加载功能
请使用codegraph 分析项目，处理如下需求
当我在地址栏中录入参数vouchId时，如下：
http://127.0.0.1:5173/?compCode=0001&copyCode=001&acctYear=2026&acctMonth=05&account=vh&vouchId=1
需按vouchId查询凭证主表，明细表，辅助核算表，将查询到的数据，加载到当前凭证展示。
注：如acct_vouch表中存在以下值：
1、auditor 有值，则状态 为：已审核
2、poster 有值，则状态 为：已记账
3、如maker与传入参数account对应的sys_emp表中的emp_name不一致时，状态为：查看
4、如maker与传入参数account对应的sys_emp表中的emp_name一致时，状态为：编辑

当状态为：已审核/已记账/查看 时，页面上不能进行任何编辑操作(包括辅助核算)，禁用跟保存相关的按钮（除保存草稿按钮）
当我传入参数存在isWatch/isAudit参数时(如下：http://127.0.0.1:5173/?compCode=0001&copyCode=001&acctYear=2026&acctMonth=05&account=vh&vouchId=1&isWatch=1)：
1、isWatch=1 时，状态为：查看
2、isAudit=1 时，状态为：已审核/已记账
3、isAduit=1 时，auditor 有值，状态为：已审核  auditor 无值，状态为：待审
4、isAudit=1 时，保存相关按钮禁用，添加审核/销审按钮，点击审核/销审按钮，需要确认是否审核/销审,确认后，如是审核 ：需要写入当前account对应的sys_emp中的name到acct_vouch表中的auditor字段，并将is_check改为1。如果销审，需要修改auditor字段为NULL，并将is_check改为0。



## 添加 现金流量 功能。
./AITest/code/w5/oes-acct-vouch 项目中
1、凭证保存完后，凭证中存在现金类科目，弹出现金流量层，显示如下：
UI 例：
现金科目：
摘要    科目（acct_subj表的is_cash=1）  金额
摘要1   10020101                  1000000

现金标注：                           按现金科目标注  按对方科目标注
现金科目（acct_subj表的is_cash=1） 行号(科目对应分录行号，acct_vouch_detail.vouch_row) 摘要(acct_vouch_detail.summary)  现金流量科目  方向(借/贷)  金额(acct_vouch_detail.amt_debit/amt_credit)

2、现金标注：
 - 按现金科目标注：将现金流量金额，按现金流量科目进行标注。
 - 按对方科目标注：将现金流量金额，按对方科目进行标注。
 - 现金科目/行号/摘要 取凭证中，按顺序取出现金类科目(acct_subj.is_cash=1)及对应的行号/摘要/金额，如凭证中存在多个现金类科目，按顺序取出现金类科目。 (取出后按对方科目标注进行标注或按现金科目标注进行标注时自动带出对应的行号/摘要/现金科目/现金流量科目，方向，金额)
 - 方向(借/贷)：根据现金流量金额，判断是借方还是贷方。

2、点击确认，将现金流量信息，保存到现金流量表中，同时关联凭证ID。
3、现金流量表的字段结构如下： AITest\code\w5\oes-acct-vouch\docs\table\acct_cash_flow.sql
4、现金流量表中 现金流量科目 字段取表acct_cash_item表的cash_item_id字段，下拉字典应为(is_stop=0 or is_stop=1 and stop_date<getdate()) and comp_code=compCode and copy_code=copyCode and acct_year=acctYear and is_last=1
 借贷方向：direction  0:借 1:贷  
 acct_cash_item表在：AITest\code\w5\oes-acct-vouch\docs\table\acct_cash_item.sql
5、当科目方向金额为借时，现金流量科目只能选择到借方选项，科目方向金额为贷时，现金流量科目只能选择到贷方选项，加载时，自动根据科目金额方向填充 方向列字段值
6、点击保存时，要判断：
   1、现金流量科目是否选择
   2、现金流量金额是否为0
   3、现金流量方向是否选择
   4、现金流量金额是否为0
   5、现金流量总金额按科目分类（借方+贷方）是否与科目金额一致
7、现金标注 表格内的字段除现金科目/行号/方向字段不能编辑外，其他字段可以编辑，编辑时请将编辑框占满整个单元格，摘要字段录入时换行，录入完成后，要换行。现金流量科目字段选择时，要展示完整的现金流量科目名称，选择后需要换行，单元格内也是换行显示，所有换行最多2行，大于2行时，要省略号显示。
