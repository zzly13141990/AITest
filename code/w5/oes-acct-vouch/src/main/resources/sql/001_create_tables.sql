-- OES Acct Vouch - Database DDL Scripts
-- Target: SQL Server 2019+

-- 1. acct_vouch_no_seq: Sequence table for optimistic lock vouch_no generation
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'acct_vouch_no_seq')
CREATE TABLE acct_vouch_no_seq (
    comp_code   NVARCHAR(20) NOT NULL,
    copy_code   NVARCHAR(3)  NOT NULL,
    acct_year   NVARCHAR(4)  NOT NULL,
    acct_month  NVARCHAR(2)  NOT NULL,
    next_no     INT          NOT NULL DEFAULT 1,
    version     INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (comp_code, copy_code, acct_year, acct_month)
);
GO

-- 2. Unique constraint on acct_vouch for vouch_no (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_acct_vouch_no')
CREATE UNIQUE INDEX UQ_acct_vouch_no
    ON acct_vouch (comp_code, copy_code, acct_year, acct_month, vouch_no)
    WHERE vouch_no IS NOT NULL;
GO

-- 3. Index for acct_vouch_detail (vouch_id query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_vouch_detail_vouch_id')
CREATE INDEX IX_acct_vouch_detail_vouch_id
    ON acct_vouch_detail (vouch_id)
    INCLUDE (vouch_detail_id, vouch_page, vouch_row, acct_subj_code, amt_debit, amt_credit);
GO

-- 4. Index for acct_check_items (vouch_detail_id query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_check_items_vouch_detail_id')
CREATE INDEX IX_acct_check_items_vouch_detail_id
    ON acct_check_items (vouch_detail_id);
GO

-- 5. Index for acct_check_items (vouch_id query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_check_items_vouch_id')
CREATE INDEX IX_acct_check_items_vouch_id
    ON acct_check_items (vouch_id)
    INCLUDE (vouch_detail_id, acct_check_id);
GO

-- 6. Composite index for acct_check_items (vouch_detail_id, line)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_check_items_detail_line')
CREATE INDEX IX_acct_check_items_detail_line
    ON acct_check_items (vouch_detail_id, line);
GO

-- 7. Index for acct_subj queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_subj_code_comp_copy_year')
CREATE INDEX IX_acct_subj_code_comp_copy_year
    ON acct_subj (acct_subj_code, comp_code, copy_code, acct_year)
    INCLUDE (acct_subj_name, is_last, is_check, check_type1, check_type2,
             check_type3, check_type4, check_type5, check_type6, check_type7, check_type8);
GO

-- 8. [v2.1] Unique constraint on acct_subj_other_fz_setting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uk_subj_fzhs')
CREATE UNIQUE INDEX uk_subj_fzhs
    ON acct_subj_other_fz_setting (acct_subj_code, other_fzhs_idx, comp_code, copy_code, acct_year);
GO

-- 9. [v2.1] Query index on acct_subj_other_fz_setting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_subj_query')
CREATE INDEX idx_subj_query
    ON acct_subj_other_fz_setting (acct_subj_code, comp_code, copy_code, acct_year)
    INCLUDE (input_type, dict_type, dict_name, is_show, is_require);
GO

-- 10. [v2.1] Show filter index on acct_subj_other_fz_setting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_show_filter')
CREATE INDEX idx_show_filter
    ON acct_subj_other_fz_setting (is_show, comp_code, copy_code, acct_year);
GO

-- 11. [v2.1] Cascade check attr index on acct_check_attr
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_check_attr_main_table')
CREATE INDEX IX_acct_check_attr_main_table
    ON acct_check_attr (main_table_id)
    INCLUDE (attr_table_id, attr_field_code, check_field_code, attr_show_name);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_acct_check_attr_attr_table')
CREATE INDEX IX_acct_check_attr_attr_table
    ON acct_check_attr (attr_table_id)
    INCLUDE (main_table_id, main_field_code, attr_field_code, attr_show_name);
GO

PRINT '=== OES Acct Vouch DDL completed successfully ===';
GO
