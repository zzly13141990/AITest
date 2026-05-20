

/****** 对象:  Table [dbo].[acct_subj]    脚本日期: 2026/5/17 15:46:45 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_subj](
	[comp_code] [nvarchar](20) NULL,
	[copy_code] [nvarchar](3) NULL,
	[acct_year] [nvarchar](4) NULL,
	[acct_subj_code] [nvarchar](50) NULL,
	[subj_type_id] [int] NOT NULL,
	[subj_nature_code] [nvarchar](20) NULL,
	[super_code] [nvarchar](50) NULL,
	[acct_subj_name] [nvarchar](50) NULL,
	[acct_subj_name_all] [nvarchar](1000) NULL,
	[subj_level] [int] NOT NULL,
	[is_last] [char](1) NULL,
	[direction] [char](1) NULL,
	[is_cash] [char](1) NULL,
	[is_fc] [char](1) NOT NULL,
	[is_qmth] [char](1) NULL,
	[is_check] [char](1) NULL,
	[check_type1] [nvarchar](20) NULL,
	[check_type2] [nvarchar](20) NULL,
	[check_type3] [nvarchar](20) NULL,
	[check_type4] [nvarchar](20) NULL,
	[check_type5] [nvarchar](20) NULL,
	[check_type6] [nvarchar](20) NULL,
	[check_type7] [nvarchar](20) NULL,
	[check_type8] [nvarchar](20) NULL,
	[define] [nvarchar](20) NULL,
	[spell] [nvarchar](600) NULL,
	[is_stop] [char](1) NULL,
	[subj_define] [int] NOT NULL,
	[is_cbcs] [char](1) NULL,
	[is_budge] [char](1) NULL,
	[is_bad] [char](1) NULL,
	[inout_type_code] [nvarchar](20) NULL,
	[contact_type] [int] NULL,
	[curr_id] [int] NULL,
	[maturity_date] [int] NULL,
	[war_date] [int] NULL,
	[mod_code] [nvarchar](20) NULL,
	[cost_subj_code] [nvarchar](20) NULL,
	[content_id] [int] NULL,
	[acct_id] [int] NULL,
	[budg_subj_code] [nvarchar](20) NULL,
	[is_sys] [varchar](1) NULL,
	[is_alloc] [varchar](2) NULL,
	[acct_subj_id] [int] NOT NULL,
	[subj_busi_type_code] [nvarchar](20) NULL,
	[is_num_check] [int] NULL,
	[unit_code] [varchar](20) NULL,
	[acct_subj_code_ext] [nvarchar](100) NULL,
	[is_delay] [char](1) NULL,
	[data_id] [nvarchar](40) NULL,
	[is_other_fzhs] [int] NULL,
	[other_checktype1] [varchar](50) NULL,
	[other_checktype2] [varchar](50) NULL,
	[other_checktype3] [varchar](50) NULL,
	[other_checktype4] [varchar](50) NULL,
	[other_checktype5] [varchar](50) NULL,
	[is_czbksr] [int] NULL,
	[deficit_control] [nvarchar](20) NULL,
	[is_vouch_fix] [int] NULL,
	[JYKID] [varchar](32) NULL,
 CONSTRAINT [PK_acct_subj_vadp_1] PRIMARY KEY CLUSTERED 
(
	[acct_subj_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_cash]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_fc]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_qmth]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_check]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('') FOR [define]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('') FOR [spell]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_stop]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [subj_define]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_cbcs]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [maturity_date]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [war_date]
GO

ALTER TABLE [dbo].[acct_subj] ADD  CONSTRAINT [df_vadp_acct_subjacct_subj_id]  DEFAULT ((0)) FOR [acct_subj_id]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ('0') FOR [is_delay]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [is_other_fzhs]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [is_czbksr]
GO

ALTER TABLE [dbo].[acct_subj] ADD  DEFAULT ((0)) FOR [is_vouch_fix]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_subj', @level2type=N'COLUMN',@level2name=N'is_num_check'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_subj', @level2type=N'COLUMN',@level2name=N'unit_code'
GO


