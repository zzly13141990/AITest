

/****** 对象:  Table [dbo].[sys_check_define]    脚本日期: 2026/5/17 15:45:46 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sys_check_define](
	[check_id] [int] NOT NULL,
	[table_id] [nvarchar](40) NOT NULL,
	[check_name] [nvarchar](40) NOT NULL,
	[where_sql] [nvarchar](200) NULL,
	[is_intrade] [bit] NOT NULL,
	[ledger_table_id] [nvarchar](40) NULL,
	[is_stop] [char](1) NULL,
	[ledger_table_level] [int] NULL,
	[is_vouch_load] [char](1) NULL,
	[is_vouch_show_last] [int] NOT NULL,
	[check_match_rule] [char](1) NOT NULL,
	[is_show_code] [int] NOT NULL,
	[code_field_custom] [varchar](100) NULL,
	[ledger_table_id_custom] [varchar](100) NULL,
	[is_vouch_direct] [nvarchar](10) NOT NULL,
	[is_not_eq_dirct_default] [nvarchar](10) NOT NULL,
	[direct_column] [nvarchar](100) NULL,
 CONSTRAINT [PK_sys_check_define] PRIMARY KEY CLUSTERED 
(
	[check_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ((0)) FOR [is_intrade]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT (NULL) FOR [ledger_table_id]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ('0') FOR [is_vouch_load]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ((0)) FOR [is_vouch_show_last]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ('A') FOR [check_match_rule]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ((1)) FOR [is_show_code]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ('0') FOR [is_vouch_direct]
GO

ALTER TABLE [dbo].[sys_check_define] ADD  DEFAULT ('0') FOR [is_not_eq_dirct_default]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'�Ƿ�¼��ƾ֤ʱ���ø�������ѡ��������Ƿ����һ��' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_check_define', @level2type=N'COLUMN',@level2name=N'is_vouch_direct'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'���ø�������ѡ�������һ��ʱ���Ƿ��Զ���д��Ӧ����ĵ�һ����������;��is_vouch_directΪ1ʱ����������Ч' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_check_define', @level2type=N'COLUMN',@level2name=N'is_not_eq_dirct_default'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'��Ӧ�ĸ�����������У������ֶ�����' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_check_define', @level2type=N'COLUMN',@level2name=N'direct_column'
GO


