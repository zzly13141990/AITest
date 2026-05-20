USE [OESCQET-0408]
GO

/****** 对象:  Table [dbo].[UP_ORG_UNIT]    脚本日期: 2026/5/18 2:53:33 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[UP_ORG_UNIT](
	[ID] [varchar](32) NOT NULL,
	[NAME] [nvarchar](100) NULL,
	[DESCRIPTION] [varchar](255) NULL,
	[CODE] [varchar](100) NOT NULL,
	[TYPE_ID] [varchar](32) NULL,
	[TIME_BEGIN] [datetime] NULL,
	[TIME_END] [datetime] NULL,
	[IS_ENABLED] [char](1) NOT NULL,
	[CREATED_BY] [varchar](32) NULL,
	[CREATION_DATE] [datetime] NULL,
	[LAST_UPDATED_BY] [varchar](32) NULL,
	[LAST_UPDATE_DATE] [datetime] NULL,
	[DELETION_DATE] [datetime] NULL,
	[ACTIVE_FLAG] [char](1) NULL,
	[prov] [nvarchar](20) NULL,
	[prov_cn] [nvarchar](40) NULL,
	[city] [nvarchar](20) NULL,
	[city_cn] [nvarchar](40) NULL,
	[is_count] [char](1) NOT NULL,
	[address] [nvarchar](40) NULL,
	[dis_email] [nvarchar](40) NULL,
	[link_phone] [nvarchar](20) NULL,
	[linkman] [nvarchar](40) NULL,
	[tax_no] [nvarchar](20) NULL,
	[post_code] [nvarchar](20) NULL,
	[comp_leader] [nvarchar](40) NULL,
	[acc_manager] [nvarchar](40) NULL,
	[comp_level] [int] NOT NULL,
	[super_code] [nvarchar](20) NULL,
	[is_last] [char](1) NOT NULL,
	[comp_type_code] [nvarchar](20) NULL,
	[comp_level_code] [nvarchar](20) NULL,
	[institution_type_code] [nvarchar](20) NULL,
	[institution_type_cn] [nvarchar](40) NULL,
	[admin_area] [nvarchar](20) NULL,
	[admin_area_cn] [nvarchar](40) NULL,
	[hosp_level_code] [nvarchar](20) NULL,
	[hosp_level_cn] [nvarchar](40) NULL,
	[hosp_attr_code] [nvarchar](20) NULL,
	[hosp_attr_cn] [nvarchar](40) NULL,
	[subjection_code] [nvarchar](20) NULL,
	[subjection_cn] [nvarchar](40) NULL,
	[spell] [varchar](100) NULL,
	[u_id] [numeric](18, 0) NOT NULL,
	[cid] [int] IDENTITY(1,1) NOT NULL,
	[comp_level_code_cn] [nvarchar](40) NULL,
	[comp_type_code_cn] [nvarchar](40) NULL,
	[t_stamp] [timestamp] NULL,
	[plan_count] [int] NULL,
	[diff_count] [int] NULL,
	[real_count] [int] NULL,
	[comp_leader_id] [int] NULL,
	[comp_leader_cd] [varchar](20) NULL,
	[budget_code] [nvarchar](50) NULL,
	[ho_image] [varchar](200) NULL,
	[ORGTYPECODE] [varchar](100) NULL,
	[AREA_CODE] [varchar](32) NULL,
	[ORGFULLNAME] [varchar](200) NULL,
	[INSTYPE] [char](1) NULL,
	[HIGH_LINE] [numeric](16, 6) NULL,
	[LOW_LINE] [numeric](16, 6) NULL,
	[unit_code] [nvarchar](200) NULL,
	[type_code] [nvarchar](13) NULL,
	[is_sys] [char](1) NULL,
 CONSTRAINT [UP_ORG_UNIT_PK] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UN_UP_ORG_UNIT] UNIQUE NONCLUSTERED 
(
	[CODE] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[UP_ORG_UNIT] ADD  DEFAULT ((0)) FOR [is_count]
GO

ALTER TABLE [dbo].[UP_ORG_UNIT] ADD  DEFAULT ((0)) FOR [is_last]
GO

ALTER TABLE [dbo].[UP_ORG_UNIT] ADD  DEFAULT ((0)) FOR [u_id]
GO

ALTER TABLE [dbo].[UP_ORG_UNIT] ADD  DEFAULT ('0') FOR [is_sys]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ID' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'ID'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'NAME'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'描述' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'DESCRIPTION'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'CODE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'类型编码id' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'TYPE_ID'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'生效时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'TIME_BEGIN'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'失效时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'TIME_END'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否启用' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'IS_ENABLED'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'CREATED_BY'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'CREATION_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'修改人' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'LAST_UPDATED_BY'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'修改时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'LAST_UPDATE_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'删除时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'DELETION_DATE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'使用状态' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'ACTIVE_FLAG'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'省' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'prov'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'市' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'city'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否区县' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'is_count'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'详细地址' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'address'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Email' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'dis_email'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'联系电话' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'link_phone'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'联系人' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'linkman'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'税务证号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'tax_no'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'邮政编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'post_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位领导' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'comp_leader'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'主管会计' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'acc_manager'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位级次' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'comp_level'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'上级编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'super_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否末级' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'is_last'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位类别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'comp_type_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位级别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'comp_level_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'事业类别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'institution_type_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'行政区划' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'admin_area'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'医院等级' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'hosp_level_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'医院性质' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'hosp_attr_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'医院隶属' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'subjection_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'拼音码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'spell'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'财政预算编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'budget_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位类型编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'ORGTYPECODE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'区域编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'AREA_CODE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位全称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'ORGFULLNAME'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用于区分机构与单位。机构为0，单位为1（新建时写入）' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'INSTYPE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'自结算高限' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'HIGH_LINE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'自结算低限' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'LOW_LINE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'组织机构代码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'unit_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机构属性代码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'UP_ORG_UNIT', @level2type=N'COLUMN',@level2name=N'type_code'
GO

