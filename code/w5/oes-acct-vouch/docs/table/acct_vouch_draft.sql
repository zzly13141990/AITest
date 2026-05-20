-- [OESCQET-0408].dbo.acct_vouch_draft definition

-- Drop table

-- DROP TABLE [OESCQET-0408].dbo.acct_vouch_draft;

CREATE TABLE [OESCQET-0408].dbo.acct_vouch_draft (
	vouch_id int IDENTITY(1,1) NOT NULL,
	comp_code nvarchar(20) COLLATE Chinese_PRC_CI_AS NOT NULL,
	copy_code nvarchar(3) COLLATE Chinese_PRC_CI_AS NOT NULL,
	acct_year nvarchar(4) COLLATE Chinese_PRC_CI_AS NOT NULL,
	acct_month nvarchar(2) COLLATE Chinese_PRC_CI_AS NOT NULL,
	vouch_no int NOT NULL,
	vouch_date datetime NOT NULL,
	vouch_bill_num int NOT NULL,
	vouch_type_id int NOT NULL,
	vouch_source_code nvarchar(20) COLLATE Chinese_PRC_CI_AS NOT NULL,
	acc_manager nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	operator nvarchar(40) COLLATE Chinese_PRC_CI_AS NOT NULL,
	auditor nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	poster nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	is_check char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	is_acc char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	is_cx char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	is_cancel char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	is_error char(1) COLLATE Chinese_PRC_CI_AS DEFAULT 0 NOT NULL,
	errorer nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	c_vouch_id int NULL,
	acct_month1 nvarchar(2) COLLATE Chinese_PRC_CI_AS NULL,
	acct_month2 nvarchar(2) COLLATE Chinese_PRC_CI_AS NULL,
	teller nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	is_tell char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	is_chknot char(1) COLLATE Chinese_PRC_CI_AS NOT NULL,
	modifier nvarchar(40) COLLATE Chinese_PRC_CI_AS NULL,
	templet_id int NULL,
	print_num int DEFAULT 0 NOT NULL,
	is_auto int DEFAULT 0 NOT NULL,
	type_attr int DEFAULT 0 NOT NULL,
	rela_vouch_id int NULL,
	c_time datetime DEFAULT getdate() NOT NULL,
	vouch_remark varchar(200) COLLATE Chinese_PRC_CI_AS NULL,
	is_templet char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	group_name varchar(400) COLLATE Chinese_PRC_CI_AS NULL,
	extend1_vouch_no varchar(50) COLLATE Chinese_PRC_CI_AS NULL,
	extend2_vouch_no varchar(50) COLLATE Chinese_PRC_CI_AS NULL,
	CONSTRAINT PK_acct_vouch_draft PRIMARY KEY (vouch_id)
);