USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[acct_cash_flow]    脚本日期: 2026/5/19 0:08:57 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_cash_flow](
	[cash_flow_id] [int] IDENTITY(1,1) NOT NULL,
	[vouch_detail_id] [bigint] NULL,
	[line] [int] NULL,
	[summary] [nvarchar](1200) NULL,
	[cash_money] [numeric](18, 2) NOT NULL,
	[comp_code] [nvarchar](20) NOT NULL,
	[copy_code] [nvarchar](3) NOT NULL,
	[cash_item_id] [int] NOT NULL,
	[batch_code] [nvarchar](100) NULL,
	[vouch_id] [bigint] NULL,
 CONSTRAINT [PK_acct_cash_flow] PRIMARY KEY CLUSTERED 
(
	[cash_flow_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_cash_flow] ADD  DEFAULT ((0)) FOR [line]
GO

ALTER TABLE [dbo].[acct_cash_flow] ADD  DEFAULT ('') FOR [summary]
GO

ALTER TABLE [dbo].[acct_cash_flow] ADD  DEFAULT ((0)) FOR [cash_money]
GO

