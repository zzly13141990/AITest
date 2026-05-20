USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[UP_ORG_USER]    脚本日期: 2026/5/17 17:06:14 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[UP_ORG_USER](
	[ID] [varchar](32) NOT NULL,
	[ACCOUNT] [varchar](32) NULL,
	[NAME] [varchar](100) NOT NULL,
	[TYPE] [varchar](32) NULL,
	[PASSWORD] [varchar](32) NULL,
	[DESCRIPTION] [varchar](255) NULL,
	[PASSWORD_CHANGED_DATE] [datetime] NULL,
	[ACCOUNT_ENABLED] [char](1) NOT NULL,
	[ACCOUNT_LOCKED] [char](1) NOT NULL,
	[ACCOUNT_LOCKED_REASON] [char](1) NULL,
	[SEX] [char](1) NULL,
	[BIRTHDATE] [date] NULL,
	[NATIONALITY] [varchar](2) NULL,
	[CREDENTIALS_TYPE] [varchar](32) NULL,
	[CREDENTIALS_NUMBER] [varchar](32) NULL,
	[EMAIL] [varchar](100) NULL,
	[MOBILE_TELEPHONE] [varchar](16) NULL,
	[HOME_TELEPHONE] [varchar](16) NULL,
	[OFFICE_TELEPHONE] [varchar](16) NULL,
	[FAX] [varchar](16) NULL,
	[HOME_ADDRESS] [varchar](256) NULL,
	[CREATED_BY] [varchar](32) NULL,
	[CREATION_DATE] [datetime] NULL,
	[LAST_UPDATED_BY] [varchar](32) NULL,
	[LAST_UPDATE_DATE] [datetime] NULL,
	[ACTIVE_FLAG] [char](1) NULL,
	[DELETION_DATE] [datetime] NULL,
	[comp_code] [nvarchar](100) NULL,
	[emp_code] [nvarchar](20) NULL,
	[sj_account] [nvarchar](32) NULL,
	[last_mod] [nvarchar](20) NULL,
	[spell] [nvarchar](100) NULL,
	[USER_CERT_ID] [varchar](30) NULL,
	[CA_PIC_BASE64] [text] NULL,
	[temp_id] [int] NULL,
	[CATEGORY] [varchar](3) NULL,
	[USE_COMPLEX] [int] NULL,
 CONSTRAINT [UP_ORG_USER_PK] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UN_UP_ORG_USER] UNIQUE NONCLUSTERED 
(
	[ACCOUNT] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[UP_ORG_USER] ADD  DEFAULT ((0)) FOR [temp_id]
GO

ALTER TABLE [dbo].[UP_ORG_USER] ADD  DEFAULT ('10') FOR [CATEGORY]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户ID' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ID'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'帐号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ACCOUNT'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'姓名' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'NAME'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户类型' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'TYPE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'密码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'PASSWORD'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'描述信息' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'DESCRIPTION'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'密码最后一次修改时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'PASSWORD_CHANGED_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'帐号是否启用' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ACCOUNT_ENABLED'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'帐号是否锁定' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ACCOUNT_LOCKED'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'帐号锁定原因' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ACCOUNT_LOCKED_REASON'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'性别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'SEX'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'生日' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'BIRTHDATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'国籍' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'NATIONALITY'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'证件类型' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'CREDENTIALS_TYPE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'证件号码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'CREDENTIALS_NUMBER'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'邮件地址' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'EMAIL'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'移动电话' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'MOBILE_TELEPHONE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'家庭电话' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'HOME_TELEPHONE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'办公电话' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'OFFICE_TELEPHONE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'传真' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'FAX'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'家庭住址' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'HOME_ADDRESS'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'CREATED_BY'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'CREATION_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'修改人' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'LAST_UPDATED_BY'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'修改时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'LAST_UPDATE_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'使用状态' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'ACTIVE_FLAG'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'删除时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'DELETION_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户级别：10 院级、30 科室级' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_USER', @level2type=N'COLUMN',@level2name=N'CATEGORY'
GO

