USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[sys_table]    脚本日期: 2026/5/18 2:55:28 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sys_table](
	[table_id] [nvarchar](40) NOT NULL,
	[table_name] [nvarchar](40) NOT NULL,
	[code_field] [nvarchar](20) NULL,
	[name_field] [nvarchar](20) NULL,
	[level_field] [nvarchar](20) NULL,
	[table_level] [char](1) NOT NULL,
	[is_power] [char](1) NOT NULL,
	[is_year] [char](1) NOT NULL,
	[year_field] [nvarchar](40) NULL,
	[year_type] [int] NULL,
	[is_view] [char](1) NOT NULL,
	[code_data_type] [int] NOT NULL,
	[is_stat] [char](1) NOT NULL,
	[is_mod] [char](1) NOT NULL,
	[mod_sql] [nvarchar](50) NULL,
	[is_subj] [char](1) NOT NULL,
	[subj_sql] [nvarchar](100) NULL,
	[id_field] [nvarchar](25) NULL,
	[super_id_field] [nvarchar](25) NULL,
	[mod_code] [nvarchar](20) NULL,
	[table_kind_id] [nvarchar](40) NULL,
	[is_sys] [char](1) NOT NULL,
	[is_edit] [char](1) NOT NULL,
	[code_memo] [text] NULL,
	[code_index] [int] NULL,
	[code_rule] [nvarchar](20) NULL,
	[is_std_deal] [char](1) NOT NULL,
	[ref_conds] [nvarchar](200) NULL,
	[is_gbk] [char](1) NULL,
	[stop_field] [nvarchar](25) NULL,
	[is_tablename_repeat] [char](1) NULL,
	[short_name_field] [nvarchar](20) NULL,
	[is_auto_code] [nvarchar](2) NULL,
	[prefix_auto_code] [nvarchar](30) NULL,
	[auto_code_value] [nvarchar](50) NULL,
	[is_last_field] [varchar](30) NULL,
	[super_code_field] [varchar](30) NULL,
	[all_name_field] [varchar](30) NULL,
	[virtual_code_field] [nvarchar](60) NULL,
 CONSTRAINT [PK_SYS_TABLE] PRIMARY KEY CLUSTERED 
(
	[table_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [table_level]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_power]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_year]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_view]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ((1)) FOR [code_data_type]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_stat]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_mod]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_subj]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_sys]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_edit]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ((0)) FOR [code_index]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_std_deal]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_gbk]
GO

ALTER TABLE [dbo].[sys_table] ADD  DEFAULT ('0') FOR [is_tablename_repeat]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'表格名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_table', @level2type=N'COLUMN',@level2name=N'table_name'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'字段简称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_table', @level2type=N'COLUMN',@level2name=N'short_name_field'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'is_auto_code' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_table', @level2type=N'COLUMN',@level2name=N'is_auto_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'prefix_auto_code' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_table', @level2type=N'COLUMN',@level2name=N'prefix_auto_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'auto_code_value' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_table', @level2type=N'COLUMN',@level2name=N'auto_code_value'
GO

