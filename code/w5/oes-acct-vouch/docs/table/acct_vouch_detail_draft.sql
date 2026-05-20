/****** 草稿分录明细表 - acct_vouch_detail_draft ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_vouch_detail_draft](
	[vouch_detail_id] [bigint] IDENTITY(1,1) NOT NULL,
	[vouch_id] [bigint] NOT NULL,
	[vouch_page] [int] NOT NULL,
	[vouch_row] [int] NOT NULL,
	[summary] [nvarchar](1200) NULL,
	[comp_code] [nvarchar](20) NOT NULL,
	[copy_code] [nvarchar](3) NOT NULL,
	[acct_year] [nvarchar](4) NULL,
	[acct_subj_code] [nvarchar](40) NULL,
	[amt_debit] [numeric](18, 2) NOT NULL,
	[amt_credit] [numeric](18, 2) NOT NULL,
	[acc_detail_id] [int] NULL,
	[batch_code] [nvarchar](100) NULL,
	[other_subj_code] [nvarchar](2048) NULL,
 CONSTRAINT [PK_acct_vouch_detail_draft] PRIMARY KEY NONCLUSTERED
(
	[vouch_detail_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_vouch_detail_draft] ADD  DEFAULT ((0)) FOR [amt_debit]
GO
ALTER TABLE [dbo].[acct_vouch_detail_draft] ADD  DEFAULT ((0)) FOR [amt_credit]
GO
