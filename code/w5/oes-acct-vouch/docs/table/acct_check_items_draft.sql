/****** 草稿辅助核算明细表 - acct_check_items_draft ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_check_items_draft](
	[acct_check_id] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[vouch_detail_id] [bigint] NULL,
	[line] [int] NULL,
	[comp_code] [nvarchar](20) NOT NULL,
	[copy_code] [nvarchar](3) NOT NULL,
	[acct_year] [nvarchar](4) NOT NULL,
	[acct_subj_code] [nvarchar](50) NULL,
	[order_id] [nvarchar](40) NULL,
	[order_no] [nvarchar](40) NULL,
	[occur_date] [datetime] NULL,
	[order_date] [datetime] NULL,
	[summary] [nvarchar](1200) NULL,
	[pay_type_id] [int] NULL,
	[cheq_no] [nvarchar](100) NULL,
	[other_bank_no] [nvarchar](20) NULL,
	[check_bank_id] [int] NULL,
	[check_run_id] [int] NULL,
	[check_date] [datetime] NULL,
	[amt_debit] [numeric](18, 2) NOT NULL,
	[amt_credit] [numeric](18, 2) NOT NULL,
	[curr_id] [int] NULL,
	[exch_rate] [numeric](18, 10) NOT NULL,
	[amt_debit_f] [numeric](18, 2) NOT NULL,
	[amt_credit_f] [numeric](18, 2) NOT NULL,
	[cash_item_id] [int] NULL,
	[bal_amt] [numeric](18, 2) NULL,
	[is_init] [char](1) NOT NULL,
	[vouch_type_id] [int] NULL,
	[vouch_id] [bigint] NULL,
	[checktype1] [int] NULL,
	[checktype2] [int] NULL,
	[checktype3] [int] NULL,
	[checktype4] [int] NULL,
	[checktype5] [int] NULL,
	[checktype6] [int] NULL,
	[checktype7] [int] NULL,
	[checktype8] [int] NULL,
	[checktype9] [int] NULL,
	[checktype10] [int] NULL,
	[checktype11] [int] NULL,
	[checktype12] [int] NULL,
	[checktype13] [int] NULL,
	[checktype14] [int] NULL,
	[checktype15] [int] NULL,
	[checktype16] [int] NULL,
	[checktype17] [int] NULL,
	[checktype18] [int] NULL,
	[checktype19] [int] NULL,
	[checktype20] [int] NULL,
	[checktype21] [int] NULL,
	[checktype22] [int] NULL,
	[checktype23] [int] NULL,
	[checktype24] [int] NULL,
	[checktype25] [int] NULL,
	[checktype26] [int] NULL,
	[checktype27] [int] NULL,
	[checktype28] [int] NULL,
	[checktype29] [int] NULL,
	[checktype30] [int] NULL,
	[checktype31] [int] NULL,
	[checktype32] [int] NULL,
	[checktype33] [int] NULL,
	[checktype34] [int] NULL,
	[checktype35] [int] NULL,
	[checktype36] [int] NULL,
	[checktype37] [int] NULL,
	[checktype38] [int] NULL,
	[checktype39] [int] NULL,
	[checktype40] [int] NULL,
	[checktype41] [int] NULL,
	[checktype42] [int] NULL,
	[checktype43] [int] NULL,
	[checktype44] [int] NULL,
	[checktype45] [int] NULL,
	[checktype46] [int] NULL,
	[checktype47] [int] NULL,
	[checktype48] [int] NULL,
	[checktype49] [int] NULL,
	[checktype50] [int] NULL,
	[busi_date] [datetime] NULL,
	[batch_code] [nvarchar](100) NULL,
	[vouch_no] [int] NULL,
	[is_year_end] [char](1) NULL,
	[open_state] [char](1) NULL,
	[detail_summary] [nvarchar](1200) NULL,
	[acct_month] [nvarchar](2) NULL,
	[vouch_date] [date] NULL,
	[vouch_row] [int] NULL,
	[vouch_source_code] [nvarchar](20) NULL,
	[is_error] [char](1) NULL,
	[is_acc] [char](1) NULL,
	[is_cancel] [char](1) NULL,
	[acct_vouch_no] [int] NULL,
	[acct_vouch_id] [int] NULL,
	[receipt_no] [nvarchar](50) NULL,
	[docId] [nvarchar](200) NULL,
	[UNIT_ID] [int] NULL,
	[UNIT_NUM] [numeric](10, 2) NULL,
	[UNIT_PRICE] [numeric](13, 2) NULL,
	[orig_acct_check_id] [int] NULL,
	[info_fzhs1] [varchar](100) NULL,
	[info_fzhs2] [varchar](100) NULL,
	[info_fzhs3] [varchar](100) NULL,
	[info_fzhs4] [varchar](100) NULL,
	[info_fzhs5] [varchar](100) NULL,
	[orig_acct_subj_code] [nvarchar](40) NULL,
 CONSTRAINT [PK_acct_check_items_draft] PRIMARY KEY CLUSTERED
(
	[acct_check_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [line]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ('') FOR [summary]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [amt_debit]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [amt_credit]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [exch_rate]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [amt_debit_f]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ((0)) FOR [amt_credit_f]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ('0') FOR [is_init]
GO
ALTER TABLE [dbo].[acct_check_items_draft] ADD  DEFAULT ('0') FOR [open_state]
GO
