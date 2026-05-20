USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[acct_cash_flow_draft]    脚本日期: 2026/5/19 0:09:12 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_cash_flow_draft](
	[cash_flow_id] [int] IDENTITY(1,1) NOT NULL,
	[vouch_detail_id] [int] NULL,
	[line] [int] NULL,
	[summary] [nvarchar](1200) NULL,
	[cash_money] [numeric](18, 2) NOT NULL,
	[comp_code] [nvarchar](20) NOT NULL,
	[copy_code] [nvarchar](3) NOT NULL,
	[cash_item_id] [int] NOT NULL,
	[vouch_id] [int] NULL,
 CONSTRAINT [PK_acct_cash_flow_draft] PRIMARY KEY CLUSTERED 
(
	[cash_flow_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

