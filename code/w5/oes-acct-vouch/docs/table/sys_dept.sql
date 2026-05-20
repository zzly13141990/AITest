USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[sys_dept]    脚本日期: 2026/5/17 17:08:19 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sys_dept](
	[comp_code] [nvarchar](20) NOT NULL,
	[dept_code] [nvarchar](20) NOT NULL,
	[dept_name] [nvarchar](40) NOT NULL,
	[dept_name_all] [nvarchar](100) NOT NULL,
	[super_code] [nvarchar](20) NULL,
	[kind_id] [int] NULL,
	[kind_idcd] [nvarchar](20) NULL,
	[kind_idcd_cn] [nvarchar](40) NULL,
	[type_code] [nvarchar](20) NOT NULL,
	[type_code_cn] [nvarchar](40) NULL,
	[attr_code] [nvarchar](20) NULL,
	[attr_code_cn] [nvarchar](40) NULL,
	[dept_level] [nvarchar](20) NOT NULL,
	[dept_level_cn] [nvarchar](40) NULL,
	[spell] [nvarchar](40) NULL,
	[is_func] [char](1) NOT NULL,
	[is_last] [char](1) NOT NULL,
	[is_stock] [char](1) NOT NULL,
	[is_service] [char](1) NOT NULL,
	[inout_type_code] [nvarchar](20) NULL,
	[inout_type_code_cn] [nvarchar](40) NULL,
	[dept_addr] [nvarchar](40) NULL,
	[is_stop] [char](1) NOT NULL,
	[stop_date] [datetime] NULL,
	[is_app] [char](1) NOT NULL,
	[app_level] [int] NOT NULL,
	[u_id] [numeric](18, 0) NULL,
	[proportion] [int] NULL,
	[plan_count] [int] NULL,
	[real_count] [int] NULL,
	[diff_count] [int] NULL,
	[image_path] [varchar](200) NULL,
	[stand_dept_id] [int] NULL,
	[branch_id] [int] NULL,
	[branch_code] [nvarchar](20) NULL,
	[branch_cn] [nvarchar](40) NULL,
	[is_common_path] [char](1) NULL,
	[dept_leader] [nvarchar](20) NULL,
	[dept_leader_id] [int] NULL,
	[dept_leader_cn] [nvarchar](40) NULL,
	[time_begin] [datetime] NULL,
	[created_by] [nvarchar](20) NULL,
	[creation_date] [datetime] NULL,
	[last_update_by] [nvarchar](20) NULL,
	[last_update_date] [datetime] NULL,
	[t_stamp] [timestamp] NULL,
	[dept_manager] [nvarchar](20) NULL,
	[dept_manager_id] [int] NULL,
	[dept_manager_cn] [nvarchar](40) NULL,
	[update_time] [datetime] NULL,
	[is_extend] [char](1) NULL,
	[history_id] [int] NULL,
	[description] [varchar](200) NULL,
	[is_budget] [char](1) NOT NULL,
	[dept_path] [nvarchar](500) NULL,
	[gsywks] [int] NULL,
	[gsdk] [int] NULL,
	[gszdzk] [int] NULL,
	[gszdxk] [int] NULL,
	[budgeter] [int] NULL,
	[is_sys] [char](1) NULL,
	[stand_dept] [nvarchar](20) NULL,
	[stand_dept_cn] [nvarchar](40) NULL,
	[gszdxk_cd] [nvarchar](20) NULL,
	[gszdxk_cd_cn] [nvarchar](40) NULL,
	[gszdzk_cd] [nvarchar](20) NULL,
	[gszdzk_cd_cn] [nvarchar](40) NULL,
	[gsywks_cd] [nvarchar](20) NULL,
	[gsywks_cd_cn] [nvarchar](40) NULL,
	[gsdk_cd] [nvarchar](20) NULL,
	[gsdk_cd_cn] [nvarchar](40) NULL,
	[budgeter_cd] [nvarchar](20) NULL,
	[budgeter_cd_cn] [nvarchar](40) NULL,
	[dept_id] [int] NOT NULL,
	[matron_id] [int] NULL,
	[matron_id_cn] [varchar](50) NULL,
	[matron] [varchar](10) NULL,
	[sys_ext1] [nvarchar](50) NULL,
	[sys_ext2] [nvarchar](50) NULL,
	[sys_ext3] [nvarchar](50) NULL,
	[sys_ext4] [nvarchar](50) NULL,
	[sys_ext5] [nvarchar](50) NULL,
	[sys_ext6] [nvarchar](50) NULL,
	[sys_ext7] [nvarchar](50) NULL,
	[sys_ext8] [nvarchar](50) NULL,
	[sys_ext9] [nvarchar](100) NULL,
	[sys_ext10] [nvarchar](100) NULL,
	[sys_ext11] [nvarchar](50) NULL,
	[sys_ext12] [nvarchar](50) NULL,
	[sys_ext13] [nvarchar](50) NULL,
	[sys_ext14] [nvarchar](50) NULL,
	[sys_ext15] [nvarchar](50) NULL,
	[sys_ext16] [numeric](18, 6) NULL,
	[sys_ext17] [numeric](18, 6) NULL,
	[sys_ext18] [numeric](18, 6) NULL,
	[sys_ext19] [numeric](18, 6) NULL,
	[sys_ext20] [numeric](18, 6) NULL,
	[sys_ext21] [numeric](18, 6) NULL,
	[sys_ext22] [numeric](18, 6) NULL,
	[sys_ext23] [numeric](18, 6) NULL,
	[sys_ext24] [numeric](18, 6) NULL,
	[sys_ext25] [numeric](18, 6) NULL,
	[sys_ext26] [date] NULL,
	[sys_ext27] [date] NULL,
	[sys_ext28] [date] NULL,
	[sys_ext29] [date] NULL,
	[sys_ext30] [date] NULL,
	[data_id] [nvarchar](40) NULL,
	[dept_contact] [nvarchar](40) NULL,
	[nurse_mger] [varchar](200) NULL,
	[nurse_mger_cn] [varchar](100) NULL,
	[JYKID] [varchar](32) NULL,
	[head_nurse_id] [varchar](100) NULL,
	[px_code] [varchar](100) NULL,
 CONSTRAINT [PK_sys_dept_vadp_1] PRIMARY KEY CLUSTERED 
(
	[dept_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_fun__422DC1E7]  DEFAULT ('0') FOR [is_func]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_las__4321E620]  DEFAULT ('0') FOR [is_last]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_sto__44160A59]  DEFAULT ('0') FOR [is_stock]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_ser__450A2E92]  DEFAULT ('0') FOR [is_service]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_sto__46F27704]  DEFAULT ('0') FOR [is_stop]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_app__47E69B3D]  DEFAULT ((0)) FOR [is_app]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__app_le__48DABF76]  DEFAULT ((0)) FOR [app_level]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__u_id__49CEE3AF]  DEFAULT ((0)) FOR [u_id]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_bud__4AC307E8]  DEFAULT ('1') FOR [is_budget]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [DF__sys_dept__is_sys__26FDD61A]  DEFAULT ('0') FOR [is_sys]
GO

ALTER TABLE [dbo].[sys_dept] ADD  CONSTRAINT [df_vadp_dept_id_sys_dept]  DEFAULT ((0)) FOR [dept_id]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'comp_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'dept_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'dept_name'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门全称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'dept_name_all'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'上级编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'super_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门类别编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'kind_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门类型序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'kind_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门类型名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'kind_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门类型编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'type_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门类别名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'type_code_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门性质编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'attr_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门性质名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'attr_code_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门级别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'dept_level'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'拼音码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'spell'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职能科室标记' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_func'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'末级标志' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_last'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否采购' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_stock'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否服务' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_service'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'收支类型编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'inout_type_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'收支类型名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'inout_type_code_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'科室地址' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'dept_addr'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'停用标志' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_stop'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'停用日期' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'stop_date'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否分摊' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_app'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'分摊级次' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'app_level'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'修改时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'update_time'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否继承数据' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_extend'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'历史ID' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'history_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否预算科室' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'is_budget'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'归属业务科室' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'gsywks'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'归属大科' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'gsdk'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'归属重点专科' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'gszdzk'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'归属重点学科' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'gszdxk'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ش¤ثمش±' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'budgeter'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'护士长ID' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'matron_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'护士长CN' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'matron_id_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'护士长cd' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_dept', @level2type=N'COLUMN',@level2name=N'matron'
GO

