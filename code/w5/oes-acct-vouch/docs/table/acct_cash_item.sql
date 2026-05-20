USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[acct_cash_item]    脚本日期: 2026/5/19 17:49:03 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_cash_item](
	[cash_item_id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[cash_item_code] [nvarchar](20) NOT NULL,
	[cash_item_name] [nvarchar](60) NOT NULL,
	[cash_type_id] [int] NOT NULL,
	[direction] [char](1) NOT NULL,
	[comp_code] [nvarchar](20) NULL,
	[copy_code] [nvarchar](3) NULL,
	[is_transfer] [char](1) NOT NULL,
	[spell] [nvarchar](60) NULL,
	[is_stop] [char](1) NOT NULL,
	[stop_date] [datetime] NULL,
	[super_code] [varchar](20) NULL,
	[acct_year] [varchar](4) NULL,
	[is_last] [char](1) NOT NULL,
 CONSTRAINT [PK_ACCT_CASH_ITEM] PRIMARY KEY CLUSTERED 
(
	[cash_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_cash_item] ADD  DEFAULT ('0') FOR [direction]
GO

ALTER TABLE [dbo].[acct_cash_item] ADD  DEFAULT ((0)) FOR [is_transfer]
GO

ALTER TABLE [dbo].[acct_cash_item] ADD  DEFAULT ((0)) FOR [is_stop]
GO

ALTER TABLE [dbo].[acct_cash_item] ADD  DEFAULT ('1') FOR [is_last]
GO

