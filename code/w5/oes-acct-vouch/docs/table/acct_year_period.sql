-- [OESCQET-0408].dbo.acct_year_period definition

-- Drop table

-- DROP TABLE [OESCQET-0408].dbo.acct_year_period;

CREATE TABLE [OESCQET-0408].dbo.acct_year_period (
	comp_code nvarchar(20) COLLATE Chinese_PRC_CI_AS NOT NULL,
	copy_code nvarchar(3) COLLATE Chinese_PRC_CI_AS NOT NULL,
	acct_year nvarchar(4) COLLATE Chinese_PRC_CI_AS NOT NULL,
	acct_month nvarchar(2) COLLATE Chinese_PRC_CI_AS NOT NULL,
	begin_date datetime NOT NULL,
	end_date datetime NOT NULL,
	cash_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	fix_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	mat_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	med_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	drugstore_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	wage_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	acc_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	budg_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	perf_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	cost_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	sgme_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	mat_check_date datetime NULL,
	fix_check_date datetime NULL,
	is_depreciation char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	time_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	hr_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	item_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	fund_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	bankroll_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	finance_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	invest_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	withdraw_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	att_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT '0' NOT NULL,
	acct_month_id int DEFAULT 0 NOT NULL,
	amortize_flag char(1) COLLATE Chinese_PRC_CI_AS NULL,
	sys_copy_id int NULL,
	ledger_flag char(1) COLLATE Chinese_PRC_CI_AS DEFAULT 1 NOT NULL,
	cash_close_date date NULL,
	CONSTRAINT AK_KEY_2_ACCT_YEA UNIQUE (comp_code,copy_code,acct_year,acct_month),
	CONSTRAINT PK_acct_year_period_vadp_1 PRIMARY KEY (acct_month_id)
);
CREATE UNIQUE NONCLUSTERED INDEX AK_KEY_2_ACCT_YEA ON [OESCQET-0408].dbo.acct_year_period (comp_code, copy_code, acct_year, acct_month);