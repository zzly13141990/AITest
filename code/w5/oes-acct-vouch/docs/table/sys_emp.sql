USE [OESDPYY-0513]
GO

/****** 对象:  Table [dbo].[sys_emp]    脚本日期: 2026/5/17 17:07:21 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sys_emp](
	[emp_code] [nvarchar](40) NULL,
	[emp_name] [nvarchar](40) NOT NULL,
	[comp_code] [nvarchar](20) NOT NULL,
	[id_code] [nvarchar](500) NULL,
	[emp_in_day] [datetime] NULL,
	[emp_birthday] [datetime] NULL,
	[emp_type_id] [int] NOT NULL,
	[emp_type_idcd] [nvarchar](20) NULL,
	[emp_type_idcd_cn] [nvarchar](40) NULL,
	[emp_sex] [nvarchar](1) NOT NULL,
	[work_phone] [nvarchar](20) NULL,
	[mobile_phone] [nvarchar](20) NULL,
	[email] [nvarchar](40) NULL,
	[bank_account] [nvarchar](40) NULL,
	[is_stock] [char](1) NOT NULL,
	[spell] [nvarchar](40) NULL,
	[emp_desc] [nvarchar](200) NULL,
	[emp_pol_id] [int] NULL,
	[emp_pol_idcd] [nvarchar](20) NULL,
	[emp_pol_idcd_cn] [nvarchar](40) NULL,
	[image_path] [nvarchar](200) NULL,
	[password] [nvarchar](20) NULL,
	[emp_degree_id] [int] NULL,
	[emp_degree_idcd] [nvarchar](20) NULL,
	[emp_degree_idcd_cn] [nvarchar](40) NULL,
	[professional_code] [nvarchar](20) NULL,
	[professional_code_cn] [nvarchar](40) NULL,
	[school] [nvarchar](100) NULL,
	[graduate_day] [datetime] NULL,
	[education_bg_id] [int] NULL,
	[education_bg_idcd] [nvarchar](20) NULL,
	[education_bg_idcd_cn] [nvarchar](40) NULL,
	[duty_id] [int] NULL,
	[duty_idcd] [nvarchar](20) NULL,
	[duty_idcd_cn] [nvarchar](40) NULL,
	[card_no] [nvarchar](20) NULL,
	[try_begin_date] [datetime] NULL,
	[try_end_date] [datetime] NULL,
	[emp_time_id] [int] NULL,
	[emp_time_idcd] [nvarchar](20) NULL,
	[emp_time_idcd_cn] [nvarchar](40) NULL,
	[is_jb] [char](1) NOT NULL,
	[special_id] [int] NULL,
	[special_idcd] [nvarchar](20) NULL,
	[special_idcd_cn] [nvarchar](40) NULL,
	[title_day] [datetime] NULL,
	[duty_day] [datetime] NULL,
	[health_type_id] [int] NULL,
	[health_type_idcd] [nvarchar](20) NULL,
	[health_type_idcd_cn] [nvarchar](40) NULL,
	[is_stop] [char](1) NOT NULL,
	[dept_id] [int] NULL,
	[emp_sex_cn] [nvarchar](25) NULL,
	[dept_code] [nvarchar](20) NULL,
	[firstjob_day] [datetime] NULL,
	[people] [nvarchar](20) NULL,
	[people_cn] [nvarchar](20) NULL,
	[title_id] [int] NULL,
	[title_idcd_cn] [nvarchar](40) NULL,
	[position_code] [nvarchar](20) NULL,
	[position_code_cn] [nvarchar](40) NULL,
	[title_idcd] [nvarchar](20) NULL,
	[u_id] [int] NULL,
	[position_series] [nvarchar](20) NULL,
	[position_series_cn] [nvarchar](40) NULL,
	[position_level] [nvarchar](20) NULL,
	[position_level_cn] [nvarchar](40) NULL,
	[comefrom] [nvarchar](20) NULL,
	[comefrom_cn] [nvarchar](40) NULL,
	[slry_bdate] [datetime] NULL,
	[deal_date] [datetime] NULL,
	[is_pay] [char](1) NOT NULL,
	[is_foreign] [char](1) NOT NULL,
	[pay_way] [nvarchar](20) NULL,
	[pay_way_cn] [nvarchar](40) NULL,
	[t_stamp] [timestamp] NULL,
	[grade] [nvarchar](20) NULL,
	[grade_cn] [nvarchar](40) NULL,
	[job_level] [nvarchar](20) NULL,
	[job_level_cn] [nvarchar](40) NULL,
	[emp_status_id] [int] NULL,
	[emp_status] [nvarchar](20) NULL,
	[emp_status_cn] [nvarchar](40) NULL,
	[active_status_id] [int] NULL,
	[active_status] [nvarchar](20) NULL,
	[active_status_cn] [nvarchar](40) NULL,
	[employtype_id] [int] NULL,
	[employtype] [nvarchar](20) NULL,
	[employtype_cn] [nvarchar](40) NULL,
	[nl] [int] NULL,
	[update_time] [datetime] NULL,
	[is_formation] [char](1) NULL,
	[emp_order] [int] NULL,
	[emp_photo] [varchar](500) NULL,
	[age] [nvarchar](60) NULL,
	[passport_code] [nvarchar](60) NULL,
	[nurse_age] [nvarchar](60) NULL,
	[ssn] [nvarchar](60) NULL,
	[practice_case] [nvarchar](60) NULL,
	[practise_cert] [nvarchar](60) NULL,
	[tech_work] [nvarchar](60) NULL,
	[tech_level] [nvarchar](60) NULL,
	[tech_cert] [nvarchar](60) NULL,
	[only_child_parent] [nvarchar](60) NULL,
	[degree_id] [nvarchar](60) NULL,
	[belong_hosp] [nvarchar](60) NULL,
	[class_group] [nvarchar](60) NULL,
	[post_kind] [nvarchar](60) NULL,
	[post_duty] [nvarchar](60) NULL,
	[duty_level] [nvarchar](60) NULL,
	[is_special_duty] [nvarchar](60) NULL,
	[is_key_duty] [nvarchar](60) NULL,
	[is_onjob] [nvarchar](60) NULL,
	[duty_type] [nvarchar](60) NULL,
	[mana_post_level] [nvarchar](60) NULL,
	[spec_post_level] [nvarchar](60) NULL,
	[salary_level] [nvarchar](60) NULL,
	[worker_usetype] [nvarchar](60) NULL,
	[med_dept] [nvarchar](60) NULL,
	[work_age] [int] NULL,
	[epid_level] [nvarchar](60) NULL,
	[work_age_range] [nvarchar](60) NULL,
	[kid_num] [nvarchar](60) NULL,
	[work_time] [datetime] NULL,
	[nurse_time] [datetime] NULL,
	[post_level] [nvarchar](60) NULL,
	[is_labour] [char](1) NULL,
	[nationality] [nvarchar](60) NULL,
	[child_birthday] [datetime] NULL,
	[urgency_person] [nvarchar](60) NULL,
	[urgency_person_phone] [nvarchar](60) NULL,
	[attend_org_day] [nvarchar](60) NULL,
	[emp_ss_widget] [varchar](3000) NULL,
	[birth_place] [nvarchar](60) NULL,
	[reform_age] [nvarchar](60) NULL,
	[honour_title] [nvarchar](60) NULL,
	[person_source] [nvarchar](60) NULL,
	[record_no] [nvarchar](60) NULL,
	[person_identity] [nvarchar](60) NULL,
	[is_defor] [varchar](1) NULL,
	[hospital_age] [int] NULL,
	[emp_pol_day] [datetime] NULL,
	[id_type] [nvarchar](10) NULL,
	[urgency_person_rela] [nvarchar](60) NULL,
	[nurse_age_range] [nvarchar](60) NULL,
	[native_place] [nvarchar](60) NULL,
	[title_level] [nvarchar](10) NULL,
	[puc_card_num] [varchar](20) NULL,
	[reg_residence_type] [nvarchar](20) NULL,
	[reg_residence_type_cn] [nvarchar](20) NULL,
	[home_address] [nvarchar](100) NULL,
	[zip_code] [nvarchar](6) NULL,
	[sign_image] [ntext] NULL,
	[IS_HAVEHOUSE] [char](1) NULL,
	[is_resident] [char](1) NULL,
	[cost_dept_id] [int] NULL,
	[first_edu] [nvarchar](20) NULL,
	[first_edu_cn] [nvarchar](40) NULL,
	[id_typecd] [nvarchar](20) NULL,
	[id_typecd_cn] [nvarchar](40) NULL,
	[native] [nvarchar](100) NULL,
	[is_marry] [nvarchar](100) NULL,
	[is_marry_cn] [nvarchar](100) NULL,
	[is_sys] [char](1) NULL,
	[emp_id] [int] NOT NULL,
	[is_account] [char](1) NULL,
	[sys_ext1] [nvarchar](50) NULL,
	[sys_ext2] [nvarchar](50) NULL,
	[sys_ext3] [nvarchar](50) NULL,
	[sys_ext4] [nvarchar](50) NULL,
	[sys_ext5] [nvarchar](50) NULL,
	[sys_ext6] [nvarchar](50) NULL,
	[sys_ext7] [nvarchar](50) NULL,
	[sys_ext8] [nvarchar](50) NULL,
	[sys_ext9] [nvarchar](50) NULL,
	[sys_ext10] [nvarchar](50) NULL,
	[sys_ext11] [nvarchar](50) NULL,
	[sys_ext12] [nvarchar](50) NULL,
	[sys_ext13] [nvarchar](50) NULL,
	[sys_ext14] [nvarchar](50) NULL,
	[sys_ext15] [nvarchar](50) NULL,
	[sys_ext16] [numeric](18, 6) NULL,
	[sys_ext17] [numeric](18, 6) NULL,
	[sys_ext18] [numeric](18, 6) NULL,
	[sys_ext19] [numeric](18, 6) NULL,
	[sys_ext20] [numeric](18, 6) NULL,
	[sys_ext21] [numeric](18, 6) NULL,
	[sys_ext22] [numeric](18, 6) NULL,
	[sys_ext23] [numeric](18, 6) NULL,
	[sys_ext24] [numeric](18, 6) NULL,
	[sys_ext25] [numeric](18, 6) NULL,
	[sys_ext26] [date] NULL,
	[sys_ext27] [date] NULL,
	[sys_ext28] [date] NULL,
	[sys_ext29] [date] NULL,
	[sys_ext30] [date] NULL,
	[talent_project] [nvarchar](500) NULL,
	[enjoy_treatment_level] [nvarchar](100) NULL,
	[nursing_time] [int] NULL,
	[housing_allowance_type] [nvarchar](100) NULL,
	[take_time] [datetime] NULL,
	[retire_time] [datetime] NULL,
	[origin_emp_type_id] [int] NULL,
	[origin_dept_id] [int] NULL,
	[origin_title_id] [nvarchar](40) NULL,
	[data_id] [nvarchar](40) NULL,
	[job_grade] [int] NULL,
	[job_grade_cn] [varchar](100) NULL,
	[old_emp_code] [varchar](200) NULL,
	[post_subsidy] [decimal](14, 2) NULL,
	[dept_in_day] [datetime] NULL,
	[departure_date] [datetime] NULL,
	[reason_departure] [varchar](400) NULL,
	[blood_type] [varchar](20) NULL,
	[positive_date] [datetime] NULL,
	[tsbtdj] [varchar](200) NULL,
	[tsbtje] [decimal](14, 2) NULL,
	[jsjdj] [varchar](200) NULL,
	[yydj] [varchar](200) NULL,
	[hkszd] [varchar](400) NULL,
	[speciality] [varchar](400) NULL,
	[zhuanyemc] [varchar](200) NULL,
	[xzzw] [varchar](400) NULL,
	[xzzwrq] [datetime] NULL,
	[pytype] [varchar](400) NULL,
	[pytype_cn] [varchar](100) NULL,
	[position_name] [varchar](400) NULL,
	[worktype] [varchar](200) NULL,
	[worktype_cn] [varchar](100) NULL,
	[wzbm] [varchar](200) NULL,
	[contractcode] [varchar](200) NULL,
	[firstcontrdate] [datetime] NULL,
	[wgrq] [datetime] NULL,
	[ltxrq] [datetime] NULL,
	[empcategory] [varchar](200) NULL,
	[empcategory_cn] [varchar](100) NULL,
	[gzmc] [varchar](200) NULL,
	[zgdjhm] [varchar](200) NULL,
	[transfer_state_id] [varchar](16) NULL,
	[transfer_state_id_cn] [varchar](100) NULL,
	[transfer_state_date] [datetime] NULL,
	[formal_military_method] [varchar](100) NULL,
	[formal_military_method_cn] [varchar](100) NULL,
	[formal_military_date] [datetime] NULL,
	[emp_batch] [varchar](100) NULL,
	[height] [nvarchar](20) NULL,
	[fertility_circ] [varchar](40) NULL,
	[fertility_circ_cn] [varchar](100) NULL,
	[technical_posi] [varchar](40) NULL,
	[technical_posi_cn] [varchar](100) NULL,
	[technical_qual] [varchar](40) NULL,
	[technical_qual_cn] [varchar](100) NULL,
	[technical_posi_date] [datetime] NULL,
	[technical_qual_date] [datetime] NULL,
	[dslrylevel] [varchar](40) NULL,
	[dslrylevel_cn] [varchar](100) NULL,
	[mentor] [varchar](40) NULL,
	[mentor_cn] [varchar](100) NULL,
	[other_info] [varchar](400) NULL,
	[dp_degree] [varchar](40) NULL,
	[dp_degree_cn] [varchar](100) NULL,
	[dp_gb_edu] [varchar](40) NULL,
	[dp_gb_edu_cn] [varchar](100) NULL,
	[technical_posi_id] [varchar](40) NULL,
	[technical_posi_id_cn] [varchar](100) NULL,
	[technical_qual_id] [varchar](40) NULL,
	[technical_qual_id_cn] [varchar](100) NULL,
	[jsjdj_cert] [varchar](200) NULL,
	[yydj_cert] [varchar](200) NULL,
	[dp_title_id] [varchar](40) NULL,
	[dp_title_id_cn] [varchar](100) NULL,
	[dp_title_day] [datetime] NULL,
	[lsddw] [varchar](60) NULL,
	[jsazd] [varchar](60) NULL,
	[txszj] [varchar](60) NULL,
	[txsgzdc] [varchar](60) NULL,
	[yjpc] [varchar](60) NULL,
	[jtxxdz] [varchar](200) NULL,
	[lxr] [varchar](40) NULL,
	[txsgzdw] [varchar](40) NULL,
	[yzwhjsdj] [varchar](60) NULL,
	[azfs] [varchar](40) NULL,
	[sjkh] [varchar](60) NULL,
	[ytxzj] [varchar](60) NULL,
	[jobperflevel] [varchar](40) NULL,
	[jobperflevel_cn] [varchar](100) NULL,
	[subpercategory] [varchar](40) NULL,
	[subpercategory_cn] [varchar](100) NULL,
	[is_emp_pol] [char](1) NULL,
	[personnel_nature] [varchar](40) NULL,
	[personnel_nature_cn] [varchar](100) NULL,
	[personnel_category] [varchar](40) NULL,
	[personnel_category_cn] [varchar](100) NULL,
	[admin_posi] [varchar](40) NULL,
	[admin_posi_cn] [varchar](100) NULL,
	[admin_posi_level] [varchar](40) NULL,
	[admin_posi_level_cn] [varchar](100) NULL,
	[archive_situation] [varchar](100) NULL,
	[pract_qual] [varchar](40) NULL,
	[pract_qual_cn] [varchar](100) NULL,
	[pract_qual_date] [datetime] NULL,
	[tsgxjt_money] [decimal](14, 2) NULL,
	[ylbx_money] [decimal](14, 2) NULL,
	[ynbx_money] [decimal](14, 2) NULL,
	[sybx_money] [decimal](14, 2) NULL,
	[zfgjj_money] [decimal](14, 2) NULL,
	[clyhkh] [varchar](100) NULL,
	[qtjt1_money] [decimal](14, 2) NULL,
	[qtjt2_money] [decimal](14, 2) NULL,
	[fssshbt_money] [decimal](14, 2) NULL,
	[sz_dept_id] [varchar](16) NULL,
	[sz_dept_id_cn] [varchar](100) NULL,
	[begin_date] [datetime] NULL,
	[end_date] [datetime] NULL,
	[pact_year] [int] NULL,
	[gwgz] [decimal](14, 2) NULL,
	[xjgz] [decimal](14, 2) NULL,
	[syqgz] [decimal](14, 2) NULL,
	[jcxjxgz] [decimal](14, 2) NULL,
	[jcxjxfd] [decimal](14, 2) NULL,
	[fdje] [decimal](14, 2) NULL,
	[gdgz] [decimal](14, 2) NULL,
	[jdfwjt] [decimal](14, 2) NULL,
	[dqshbt] [decimal](14, 2) NULL,
	[gzxbt] [decimal](14, 2) NULL,
	[hlgwjt] [decimal](14, 2) NULL,
	[sbsshbt] [decimal](14, 2) NULL,
	[gwjxje] [decimal](14, 2) NULL,
	[fsjwf] [decimal](14, 2) NULL,
	[htqdsj] [datetime] NULL,
	[htdqsj] [datetime] NULL,
	[htfwxyqdsj] [datetime] NULL,
	[htfwxyjssj] [datetime] NULL,
	[lzlb] [varchar](60) NULL,
	[htfwxylx] [varchar](60) NULL,
	[htfwxylx_cn] [varchar](100) NULL,
	[lwgxlb] [varchar](60) NULL,
	[lwgxlb_cn] [varchar](100) NULL,
	[htlx] [varchar](60) NULL,
	[htlx_cn] [varchar](100) NULL,
	[htqx] [int] NULL,
	[dp_emp_type] [varchar](16) NULL,
	[dp_emp_type_cn] [varchar](100) NULL,
	[emp_kqlb] [varchar](100) NULL,
	[emp_kqlb_cn] [varchar](100) NULL,
	[gp_fenzu] [varchar](60) NULL,
	[gp_grade] [varchar](100) NULL,
	[gp_type] [varchar](40) NULL,
	[gp_type_cn] [varchar](100) NULL,
	[worktype_level] [varchar](40) NULL,
	[worktype_level_cn] [varchar](100) NULL,
	[pzlb] [varchar](48) NULL,
	[pzlb_cn] [varchar](100) NULL,
	[sfxshljt] [char](1) NOT NULL,
	[fssshbt_start] [datetime] NULL,
	[fssshbt_end] [datetime] NULL,
	[is_sy] [char](1) NOT NULL,
	[is_bssshjt] [char](1) NOT NULL,
	[is_wuxian] [char](1) NOT NULL,
	[is_yijin] [char](1) NOT NULL,
	[ysgp_ly] [varchar](100) NULL,
	[is_jps] [char](1) NOT NULL,
	[gz_leibie] [varchar](24) NULL,
	[gz_leibie_cn] [varchar](100) NULL,
	[evaluate] [varchar](40) NULL,
	[evaluate_cn] [varchar](100) NULL,
	[sffffsjwf] [char](1) NOT NULL,
	[sfffdqjt] [char](1) NOT NULL,
	[sffgzxjt] [char](1) NOT NULL,
	[gzff_leibie] [varchar](40) NULL,
	[gzff_leibie_cn] [varchar](100) NULL,
	[gz_dept_id] [varchar](80) NULL,
	[gz_dept_id_cn] [varchar](100) NULL,
	[is_gwk] [char](1) NOT NULL,
	[clbt_dept] [varchar](80) NULL,
	[clbt_dept_cn] [varchar](100) NULL,
	[is_clbt] [char](1) NOT NULL,
	[gpkssj] [datetime] NULL,
	[gpjssj] [datetime] NULL,
	[clbt_gw] [varchar](80) NULL,
	[clbt_gw_cn] [varchar](100) NULL,
	[ldlx] [varchar](80) NULL,
	[ldlx_cn] [varchar](100) NULL,
	[wsgwjt] [decimal](14, 2) NULL,
	[jqgwjt] [decimal](14, 2) NULL,
	[shbt] [decimal](14, 2) NULL,
	[jwjt] [decimal](14, 2) NULL,
	[jxms] [decimal](14, 2) NULL,
	[gwjx] [decimal](14, 2) NULL,
	[zfgjjgr] [decimal](14, 2) NULL,
	[py_fz] [decimal](14, 2) NULL,
	[py_wg] [decimal](14, 2) NULL,
	[yejt] [decimal](14, 2) NULL,
	[zz] [decimal](14, 2) NULL,
	[tlbxgr] [decimal](14, 2) NULL,
	[sybxgr] [decimal](14, 2) NULL,
	[ylbxgr] [decimal](14, 2) NULL,
	[dwyl] [decimal](14, 2) NULL,
	[dwsy] [decimal](14, 2) NULL,
	[dwyl1] [decimal](14, 2) NULL,
	[dwgs] [decimal](14, 2) NULL,
	[zfbt] [decimal](14, 2) NULL,
	[jxjlgz] [decimal](14, 2) NULL,
	[jbzc] [decimal](14, 2) NULL,
	[gdjxgz] [decimal](14, 2) NULL,
	[fdjxgz] [decimal](14, 2) NULL,
	[lwdlf] [decimal](14, 2) NULL,
 CONSTRAINT [PK_sys_emp_vadp_1] PRIMARY KEY CLUSTERED 
(
	[emp_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_stoc__1334728A]  DEFAULT ('0') FOR [is_stock]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_jb__142896C3]  DEFAULT ('0') FOR [is_jb]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_stop__151CBAFC]  DEFAULT ('0') FOR [is_stop]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_pay__1C11FC49]  DEFAULT ('0') FOR [is_pay]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_fore__17F927A7]  DEFAULT ((0)) FOR [is_foreign]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__emp_sta__18ED4BE0]  DEFAULT ((1)) FOR [emp_status_id]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__emp_sta__19E17019]  DEFAULT ('01') FOR [emp_status]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__emp_sta__1AD59452]  DEFAULT ('正式员工') FOR [emp_status_cn]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__active___1CBDDCC4]  DEFAULT ('01') FOR [active_status]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__active___1DB200FD]  DEFAULT ('在岗') FOR [active_status_cn]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__employt__1EA62536]  DEFAULT ((2)) FOR [employtype_id]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__employt__1F9A496F]  DEFAULT ('0101') FOR [employtype]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__employt__208E6DA8]  DEFAULT ('在编') FOR [employtype_cn]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__work_ag__218291E1]  DEFAULT (N'1') FOR [work_age_range]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_labo__2276B61A]  DEFAULT ((0)) FOR [is_labour]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__IS_HAVE__236ADA53]  DEFAULT ((0)) FOR [IS_HAVEHOUSE]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_resi__245EFE8C]  DEFAULT ((0)) FOR [is_resident]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_sys__2ACE66FE]  DEFAULT ('0') FOR [is_sys]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [df_vadp_emp_id]  DEFAULT ((0)) FOR [emp_id]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_acco__12437BAD]  DEFAULT ((0)) FOR [is_account]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__post_su__0D4B5314]  DEFAULT ((0)) FOR [post_subsidy]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__tsbtje__111BE3F8]  DEFAULT ((0)) FOR [tsbtje]
GO

ALTER TABLE [dbo].[sys_emp] ADD  CONSTRAINT [DF__sys_emp__is_emp___5D741D02]  DEFAULT ('0') FOR [is_emp_pol]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [fssshbt_money]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [pact_year]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gwgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [xjgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [syqgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jcxjxgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jcxjxfd]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [fdje]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gdgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jdfwjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [dqshbt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gzxbt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [hlgwjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [sbsshbt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gwjxje]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [fsjwf]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [htqx]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [sfxshljt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_sy]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_bssshjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_wuxian]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_yijin]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_jps]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [sffffsjwf]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [sfffdqjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [sffgzxjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ('0') FOR [is_gwk]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [wsgwjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jqgwjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [shbt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jwjt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jxms]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gwjx]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [zfgjjgr]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [py_fz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [py_wg]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [yejt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [zz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [tlbxgr]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [sybxgr]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [ylbxgr]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [dwyl]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [dwsy]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [dwyl1]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [dwgs]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [zfbt]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jxjlgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [jbzc]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [gdjxgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [fdjxgz]
GO

ALTER TABLE [dbo].[sys_emp] ADD  DEFAULT ((0)) FOR [lwdlf]
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职工编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职工姓名' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_name'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'comp_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'身份证号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'id_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'进单位时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_in_day'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'出生年月' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_birthday'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'人员类别编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_type_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'人员类别序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_type_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'人员类别名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_type_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'性别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_sex'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工作电话' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'work_phone'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'手机' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'mobile_phone'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'邮箱' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'email'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职工工号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'bank_account'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否采购员' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_stock'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'拼音码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'spell'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备注' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_desc'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'政治面貌编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_pol_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'政治面貌序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_pol_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'政治面貌名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_pol_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'图片路径' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'image_path'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'密码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'password'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学位编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_degree_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学位序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_degree_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学位名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_degree_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'专业编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'professional_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'专业名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'professional_code_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'毕业学校' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'school'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'毕业时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'graduate_day'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学历编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'education_bg_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学历序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'education_bg_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'学历名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'education_bg_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职务id' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'duty_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职务序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'duty_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职务名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'duty_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'卡号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'card_no'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'试用开始日期' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'try_begin_date'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'试用结束日期' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'try_end_date'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'考勤类别编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_time_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'考勤类别序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_time_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'考勤类别名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_time_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否教编' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_jb'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'特殊人才编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'special_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'特殊人才序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'special_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'特殊人才名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'special_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职称评聘时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'title_day'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职位任职时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'duty_day'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'卫生类别编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'health_type_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'卫生类别序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'health_type_idcd'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'卫生类别名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'health_type_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'停用标志' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_stop'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'科室编号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'dept_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'性别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_sex_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'科室编码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'dept_code'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'参加工作时间' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'firstjob_day'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'民族代码' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'people'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'民族名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'people_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职称Id' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'title_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职称名称' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'title_idcd_cn'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否发工资' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_pay'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否外籍' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_foreign'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工资发放方式' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'pay_way'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否统一编制' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_formation'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'序号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'emp_order'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工龄范围' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'work_age_range'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否劳务 1劳务，0否' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_labour'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'出生地' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'birth_place'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'套改年限' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'reform_age'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'荣誉称号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'honour_title'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'人员来源' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'person_source'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'档案号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'record_no'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'个人身份' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'person_identity'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否残疾 1残疾，0否' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_defor'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'证件类型' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'id_type'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'与紧急联系人关系' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'urgency_person_rela'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'护龄范围' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'nurse_age_range'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'籍贯' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'native_place'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'职称等级' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'title_level'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否有房' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'IS_HAVEHOUSE'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否居民：0 否 1 是' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_resident'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'成本科室' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'cost_dept_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否有账号' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'is_account'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'人才项目' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'talent_project'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'enjoy_treatment_level' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'enjoy_treatment_level'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'nursing_time' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'nursing_time'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'housing_allowance_type' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'housing_allowance_type'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'take_time' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'take_time'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'retire_time' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'retire_time'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'原职工类别' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'origin_emp_type_id'
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'原职工科室' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'sys_emp', @level2type=N'COLUMN',@level2name=N'origin_dept_id'
GO

