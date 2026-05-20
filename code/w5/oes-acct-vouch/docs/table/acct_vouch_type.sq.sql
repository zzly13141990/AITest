USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[acct_vouch_type]    脚本日期: 2026/5/18 1:23:32 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_vouch_type](
	[vouch_type_id] [int] IDENTITY(1,1) NOT NULL,
	[vouch_type_code] [nvarchar](20) NOT NULL,
	[vouch_type_name] [nvarchar](40) NOT NULL,
	[type_attr] [int] NOT NULL,
 CONSTRAINT [PK_ACCT_VOUCH_TYPE] PRIMARY KEY CLUSTERED 
(
	[vouch_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_vouch_type] ADD  DEFAULT ((0)) FOR [type_attr]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证属性类型，默认0  0:会计凭证  1:预算凭证' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch_type', @level2type=N'COLUMN',@level2name=N'type_attr'
GO

