USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[acct_vouch_type_config]    脚本日期: 2026/5/18 1:23:50 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_vouch_type_config](
	[config_id] [int] IDENTITY(1,1) NOT NULL,
	[vouch_type_id] [int] NOT NULL,
	[acct_subj_code] [varchar](200) NULL,
	[limit_type] [varchar](10) NULL,
	[comp_code] [varchar](10) NOT NULL,
	[copy_code] [varchar](10) NOT NULL,
	[acct_year] [varchar](4) NOT NULL,
	[operator] [varchar](40) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[config_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO


