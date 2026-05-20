USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[acct_subj_other_fz_setting]    脚本日期: 2026/5/17 21:02:24 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_subj_other_fz_setting](
	[setting_id] [varchar](50) NOT NULL,
	[other_fzhs_idx] [int] NOT NULL,
	[input_type] [varchar](10) NULL,
	[dict_type] [varchar](10) NULL,
	[dict_name] [varchar](100) NULL,
	[acct_subj_id] [int] NULL,
	[acct_subj_code] [varchar](50) NULL,
	[comp_code] [varchar](30) NULL,
	[copy_code] [varchar](30) NULL,
	[acct_year] [varchar](4) NULL,
	[c_time] [date] NOT NULL,
	[is_show] [int] NOT NULL,
	[is_require] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[setting_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_subj_other_fz_setting] ADD  DEFAULT (getdate()) FOR [c_time]
GO

ALTER TABLE [dbo].[acct_subj_other_fz_setting] ADD  DEFAULT ((1)) FOR [is_show]
GO

ALTER TABLE [dbo].[acct_subj_other_fz_setting] ADD  DEFAULT ((0)) FOR [is_require]
GO

