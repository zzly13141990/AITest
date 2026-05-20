USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[acct_check_attr]    脚本日期: 2026/5/17 21:01:00 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_check_attr](
	[attr_id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[main_table_id] [nvarchar](40) NOT NULL,
	[main_field_code] [nvarchar](40) NOT NULL,
	[attr_table_id] [nvarchar](40) NOT NULL,
	[attr_field_code] [nvarchar](40) NOT NULL,
	[check_field_code] [nvarchar](40) NULL,
	[RELATION_TABLE_ID] [nvarchar](40) NULL,
	[RELATION_MAIN_FIELD] [nvarchar](40) NULL,
	[relation_attr_field] [nvarchar](40) NULL,
	[is_relation] [int] NOT NULL,
	[attr_show_name] [nvarchar](40) NULL,
 CONSTRAINT [PK_ACCT_CHECK_ATTR] PRIMARY KEY CLUSTERED 
(
	[attr_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_check_attr] ADD  DEFAULT ((0)) FOR [is_relation]
GO

