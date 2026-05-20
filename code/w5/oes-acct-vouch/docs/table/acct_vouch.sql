

/****** 对象:  Table [dbo].[acct_vouch]    脚本日期: 2026/5/17 15:44:30 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[acct_vouch](
	[comp_code] [nvarchar](20) NOT NULL,
	[copy_code] [nvarchar](3) NOT NULL,
	[acct_year] [nvarchar](4) NOT NULL,
	[acct_month] [nvarchar](2) NOT NULL,
	[vouch_no] [int] NOT NULL,
	[vouch_date] [datetime] NOT NULL,
	[vouch_bill_num] [int] NOT NULL,
	[vouch_type_id] [int] NOT NULL,
	[vouch_source_code] [nvarchar](20) NOT NULL,
	[acc_manager] [nvarchar](40) NULL,
	[operator] [nvarchar](40) NOT NULL,
	[auditor] [nvarchar](40) NULL,
	[poster] [nvarchar](40) NULL,
	[is_check] [char](1) NOT NULL,
	[is_acc] [char](1) NOT NULL,
	[is_cx] [char](1) NOT NULL,
	[is_cancel] [char](1) NOT NULL,
	[is_error] [char](1) NOT NULL,
	[errorer] [nvarchar](40) NULL,
	[c_vouch_id] [bigint] NULL,
	[acct_month1] [nvarchar](2) NULL,
	[acct_month2] [nvarchar](2) NULL,
	[teller] [nvarchar](40) NULL,
	[is_tell] [char](1) NOT NULL,
	[is_chknot] [char](1) NOT NULL,
	[modifier] [nvarchar](40) NULL,
	[templet_id] [int] NULL,
	[rec_subj_code] [nvarchar](2000) NULL,
	[acc_subj_code] [nvarchar](20) NULL,
	[out_subj_code] [nvarchar](20) NULL,
	[print_num] [int] NOT NULL,
	[type_attr] [int] NOT NULL,
	[rela_vouch_id] [bigint] NULL,
	[vouch_id] [bigint] NOT NULL,
	[can_delete] [nvarchar](1) NULL,
	[vouch_no_last] [int] NULL,
	[is_czbksr] [int] NOT NULL,
	[person_vouch_no] [int] NULL,
	[extend1_vouch_no] [varchar](50) NULL,
	[extend2_vouch_no] [varchar](50) NULL,
 CONSTRAINT [PK_acct_vouch_1] PRIMARY KEY CLUSTERED 
(
	[vouch_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_ch__6908633D]  DEFAULT ('0') FOR [is_check]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_ac__69FC8776]  DEFAULT ('0') FOR [is_acc]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_cx__6AF0ABAF]  DEFAULT ('0') FOR [is_cx]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_ca__6BE4CFE8]  DEFAULT ('0') FOR [is_cancel]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_er__6CD8F421]  DEFAULT ((0)) FOR [is_error]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__print__6DCD185A]  DEFAULT ((0)) FOR [print_num]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__type___6EC13C93]  DEFAULT ((0)) FOR [type_attr]
GO

ALTER TABLE [dbo].[acct_vouch] ADD  CONSTRAINT [DF__acct_vouc__is_cz__2CA402DC]  DEFAULT ((0)) FOR [is_czbksr]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'comp_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'账套编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'copy_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'会计年度' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'acct_year'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'会计月度' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'acct_month'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证号，以年为一个周期，自动从1开始 递增' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'vouch_no'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证日期' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'vouch_date'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'附件张数' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'vouch_bill_num'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证类型，引用acct_vouch_type字典' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'vouch_type_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证来源，引用acct_vouch_source  默认01 手工录入' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'vouch_source_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'会计主管' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'acc_manager'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'制单人，引用up_org_user 表中的name' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'operator'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'审批人，取up_org_name 表中的NAME' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'auditor'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'记账人  取up_org_user表中的NAME' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'poster'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否审核  0：未审  1：已审  默认：0' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'is_check'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否记账  0：未记账  1：已记账 ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'is_acc'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否冲销  0：未冲销  1：已冲销' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'is_cx'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否作废  0：未作废  1：已作废' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'is_cancel'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否标错凭证 0：正常凭证  1：存在错误' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'is_error'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'标错人  取up_org_user表中的NAME' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'errorer'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'凭证属性，默认0  0:会计凭证  1:预算凭证' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'type_attr'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'对应的凭证号关联' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'acct_vouch', @level2type=N'COLUMN',@level2name=N'rela_vouch_id'
GO

