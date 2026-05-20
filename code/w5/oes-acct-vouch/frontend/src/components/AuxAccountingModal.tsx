import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Table, Input, InputNumber, Select, Button, Space, Typography, message, Upload, Checkbox, Tooltip } from 'antd';
import { UploadOutlined, FullscreenOutlined, FullscreenExitOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useVouchStore } from '../store/vouchStore';
import type { CheckTypeInfo, OtherFzhsInfo, CheckItem, CheckOption } from '../types/vouch';

const { Text } = Typography;
const { TextArea } = Input;

/** Row data for the auxiliary accounting table */
interface AuxRow {
  rowId: string;
  summary: string;
  /** Standard check selections: checkId -> optionId */
  checkValues: Record<number, number | null>;
  /** Other fzhs values: otherFzhsIdx -> value */
  otherValues: Record<number, string>;
  amount: number | null;
}

interface AuxAccountingModalProps {
  visible: boolean;
  detailIndex: number;
  onClose: () => void;
}

const MIN_TABLE_ROWS = 11;
const ROW_HEIGHT_PX = 52;

let rowIdCounter = 0;
function nextRowId(): string {
  return `aux_row_${++rowIdCounter}`;
}

/** Parse CSV text into rows, mapping columns to check config */
function parseCSV(
  csvText: string,
  checks: CheckTypeInfo[],
  otherFzhsChecks: OtherFzhsInfo[]
): Partial<AuxRow>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const allCheckConfigs: Array<{ key: string; type: 'standard' | 'other'; checkId?: number; otherIdx?: number }> = [];
  checks.forEach((c) => allCheckConfigs.push({ key: c.checkName, type: 'standard', checkId: c.checkId }));
  otherFzhsChecks.forEach((o) =>
    allCheckConfigs.push({ key: o.displayName || o.checkTypeName || `其他${o.otherFzhsIdx}`, type: 'other', otherIdx: o.otherFzhsIdx })
  );

  const headerLine = lines[0];
  const headerCols = headerLine.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const hasHeader = headerCols.some(
    (h) => h.includes('摘要') || h.includes('金额') || allCheckConfigs.some((cfg) => h.includes(cfg.key))
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colCount = headerCols.length;

  const results: Partial<AuxRow>[] = [];

  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const row: Partial<AuxRow> = {
      summary: '',
      checkValues: {},
      otherValues: {},
      amount: null,
    };

    if (hasHeader) {
      for (let ci = 0; ci < colCount && ci < headerCols.length; ci++) {
        const h = headerCols[ci];
        const val = cols[ci] || '';
        if (h.includes('摘要')) {
          row.summary = val;
        } else if (h.includes('金额')) {
          row.amount = parseFloat(val) || null;
        } else {
          const matchedStandard = checks.find((c) => h.includes(c.checkName));
          if (matchedStandard && val) {
            const checkState = useVouchStore.getState().detailCheckStates.get(0);
            const options = checkState?.checkOptions.get(matchedStandard.checkId) || [];
            const option = options.find((o) => val.includes(o.name) || val.includes(o.code));
            if (option) {
              if (!row.checkValues) row.checkValues = {};
              row.checkValues[matchedStandard.checkId] = option.id;
            }
            continue;
          }
          const matchedOther = otherFzhsChecks.find((o) => h.includes(o.displayName || o.checkTypeName || ''));
          if (matchedOther && val) {
            if (!row.otherValues) row.otherValues = {};
            row.otherValues[matchedOther.otherFzhsIdx] = val;
          }
        }
      }
    } else {
      let colIdx = 0;
      if (colIdx < colCount) {
        row.summary = cols[colIdx++] || '';
      }
      for (const cfg of allCheckConfigs) {
        if (colIdx >= colCount) break;
        const val = cols[colIdx++] || '';
        if (val) {
          if (cfg.type === 'standard' && cfg.checkId) {
            const checkState = useVouchStore.getState().detailCheckStates.get(0);
            const options = checkState?.checkOptions.get(cfg.checkId) || [];
            const option = options.find((o) => val.includes(o.name) || val.includes(o.code));
            if (option) {
              if (!row.checkValues) row.checkValues = {};
              row.checkValues[cfg.checkId] = option.id;
            }
          } else if (cfg.type === 'other' && cfg.otherIdx) {
            if (!row.otherValues) row.otherValues = {};
            row.otherValues[cfg.otherIdx] = val;
          }
        }
      }
      if (colIdx < colCount && cols[colIdx]) {
        row.amount = parseFloat(cols[colIdx]) || null;
      }
    }

    results.push(row);
  }

  return results;
}

/** Format amount with thousands separator: #,###,##.## */
function formatAmount(val: number | null | undefined): string {
  if (val == null) return '';
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

const AuxAccountingModal: React.FC<AuxAccountingModalProps> = ({ visible, detailIndex, onClose }) => {
  const {
    details,
    detailCheckStates,
    updateDetailCheckItems,
    updateDetail,
    loadCheckOptions,
  } = useVouchStore();

  const detail = details[detailIndex];
  const checkState = detailCheckStates.get(detailIndex);
  const config = checkState?.subjConfig;

  const checks = config?.checks || [];
  const otherFzhsChecks = config?.otherFzhsChecks || [];

  const [rows, setRows] = useState<AuxRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [batchEditValues, setBatchEditValues] = useState<Record<string, any>>({});
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [openAutoDropdown, setOpenAutoDropdown] = useState<string | null>(null);

  // Compute table scroll Y based on viewport height and modal state
  const [tableContainerEl, setTableContainerEl] = useState<HTMLDivElement | null>(null);
  const tableScrollY = React.useMemo(() => {
    if (isFullscreen) {
      // Fullscreen: will be handled by CSS flex layout
      return undefined as unknown as number;
    }
    // Normal mode: available height = 80vh - body padding - title - footer - header rows
    return Math.max(MIN_TABLE_ROWS * ROW_HEIGHT_PX, window.innerHeight * 0.8 - 280);
  }, [isFullscreen]);

  // Load existing checkItems into table rows
  useEffect(() => {
    if (!visible || !detail) return;

    const existingCheckItems = detail.checkItems || [];

    if (existingCheckItems.length === 0) {
      const firstRow = createBlankRow();
      firstRow.summary = detail.summary || '';
      const detailDebit = detail.amtDebit || 0;
      const detailCredit = detail.amtCredit || 0;
      firstRow.amount = detailDebit || detailCredit || null;
      setRows([firstRow]);
      setSelectedRowKeys([]);
      return;
    }

    const lineMap = new Map<number, CheckItem[]>();
    for (const ci of existingCheckItems) {
      const line = ci.line || 1;
      if (!lineMap.has(line)) lineMap.set(line, []);
      lineMap.get(line)!.push(ci);
    }

    const loadedRows: AuxRow[] = [];
    for (const [, items] of lineMap) {
      const row: AuxRow = {
        rowId: nextRowId(),
        summary: '',
        checkValues: {},
        otherValues: {},
        amount: null,
      };

      for (const item of items) {
        if (item.summary) row.summary = item.summary;
        if (item.amtDebit != null && item.amtDebit > 0) row.amount = (row.amount || 0) + item.amtDebit;
        if (item.amtCredit != null && item.amtCredit > 0) row.amount = (row.amount || 0) + item.amtCredit;

        if (item.checkItemType === 'standard' && item.checkValues) {
          Object.assign(row.checkValues, item.checkValues);
        }

        if (item.checkItemType === 'other' && item.otherFzhsIdx != null) {
          const val = getInfoFzhs(item, item.otherFzhsIdx);
          if (val) row.otherValues[item.otherFzhsIdx] = val;
        }
      }

      loadedRows.push(row);
    }

    // 只有1条辅助核算记录时，自动填入分录的摘要和金额
    if (loadedRows.length === 1) {
      loadedRows[0].summary = detail.summary || loadedRows[0].summary;
      const detailDebit = detail.amtDebit || 0;
      const detailCredit = detail.amtCredit || 0;
      const detailAmt = detailDebit || detailCredit || null;
      if (detailAmt != null) {
        loadedRows[0].amount = detailAmt;
      }
    }

    setRows(loadedRows.length > 0 ? loadedRows : [createBlankRow()]);
    setSelectedRowKeys([]);
  }, [visible, detailIndex]);

  // Load check options
  useEffect(() => {
    if (visible && detailIndex != null) {
      for (const check of checks) {
        loadCheckOptions(detailIndex, check.checkId);
      }
    }
  }, [visible, detailIndex, checks.length]);

  // Compute displayed rows (at least MIN_TABLE_ROWS)
  const displayRows = React.useMemo(() => {
    const result = [...rows];
    while (result.length < MIN_TABLE_ROWS) {
      result.push(createBlankRow());
    }
    return result;
  }, [rows]);

  function createBlankRow(): AuxRow {
    const blankCheckValues: Record<number, number | null> = {};
    checks.forEach((c) => { blankCheckValues[c.checkId] = null; });
    const blankOtherValues: Record<number, string> = {};
    otherFzhsChecks.forEach((o) => { blankOtherValues[o.otherFzhsIdx] = ''; });
    return {
      rowId: nextRowId(),
      summary: '',
      checkValues: blankCheckValues,
      otherValues: blankOtherValues,
      amount: null,
    };
  }

  function getInfoFzhs(item: CheckItem, idx: number): string | null {
    switch (idx) {
      case 1: return item.infoFzhs1 || null;
      case 2: return item.infoFzhs2 || null;
      case 3: return item.infoFzhs3 || null;
      case 4: return item.infoFzhs4 || null;
      case 5: return item.infoFzhs5 || null;
      default: return null;
    }
  }

  const updateRow = (rowIdx: number, updates: Partial<AuxRow>) => {
    setRows((prev) => {
      const newRows = [...prev];
      if (rowIdx < newRows.length) {
        newRows[rowIdx] = { ...newRows[rowIdx], ...updates };
      }
      return newRows;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, createBlankRow()]);
  };

  const removeRow = (rowIdx: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, i) => i !== rowIdx);
      return filtered;
    });
  };

  // Batch delete selected rows
  const batchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的行');
      return;
    }
    const realRows = rows.filter((r) => !selectedRowKeys.includes(r.rowId));
    setRows(realRows.length > 0 ? realRows : [createBlankRow()]);
    setSelectedRowKeys([]);
    message.success(`已删除${selectedRowKeys.length}行`);
  };

  // Batch edit selected rows
  const applyBatchEdit = () => {
    const hasAnyValue = Object.values(batchEditValues).some(v => v !== '' && v != null);
    if (!hasAnyValue) {
      message.warning('请至少填写一个要修改的字段');
      return;
    }
    setRows((prev) => {
      return prev.map((r) => {
        if (selectedRowKeys.includes(r.rowId)) {
          const updated = { ...r };
          Object.entries(batchEditValues).forEach(([key, value]) => {
            if (value === '' || value == null) return;
            if (key === 'summary') {
              updated.summary = value as string;
            } else if (key === 'amount') {
              updated.amount = value as number;
            } else if (key.startsWith('std_')) {
              // Standard check - value is option id
              const checkId = Number(key.replace('std_', ''));
              updated.checkValues = { ...updated.checkValues, [checkId]: value as number };
            } else if (key.startsWith('other_')) {
              // Other fzhs - value is string
              const otherIdx = Number(key.replace('other_', ''));
              updated.otherValues = { ...updated.otherValues, [otherIdx]: value as string };
            }
          });
          return updated;
        }
        return r;
      });
    });
    setShowBatchEdit(false);
    message.success(`已批量修改${selectedRowKeys.length}行`);
  };

  // Handle file import
  const handleFileImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const importedRows = parseCSV(text, checks, otherFzhsChecks);
          if (importedRows.length === 0) {
            message.warning('未能解析到有效数据，请确认CSV格式正确');
            return;
          }

          const newRows: AuxRow[] = importedRows.map((pr) => {
            const blankCheckValues: Record<number, number | null> = {};
            checks.forEach((c) => { blankCheckValues[c.checkId] = pr.checkValues?.[c.checkId] ?? null; });
            const blankOtherValues: Record<number, string> = {};
            otherFzhsChecks.forEach((o) => { blankOtherValues[o.otherFzhsIdx] = pr.otherValues?.[o.otherFzhsIdx] || ''; });
            return {
              rowId: nextRowId(),
              summary: pr.summary || '',
              checkValues: blankCheckValues,
              otherValues: blankOtherValues,
              amount: pr.amount ?? null,
            };
          });

          setRows(newRows);
          message.success(`成功导入${newRows.length}行数据`);
        } catch (err) {
          message.error('文件解析失败: ' + String(err));
        }
      };
      reader.readAsText(file);
      return false;
    },
    [checks, otherFzhsChecks]
  );

  // Convert rows to CheckItem array and save
  const handleConfirm = () => {
    // Only validate real rows (not blank padding)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasAuxInfo =
        Object.values(row.checkValues).some((v) => v != null) ||
        Object.values(row.otherValues).some((v) => v && v.trim()) ||
        row.amount != null;

      if (hasAuxInfo) {
        if (!row.summary || !row.summary.trim()) {
          message.error(`第${i + 1}行：填写了辅助核算信息或金额，摘要不能为空`);
          return;
        }

        if (row.summary.trim() && row.amount != null) {
          for (const check of checks) {
            if (row.checkValues[check.checkId] == null) {
              message.error(`第${i + 1}行：辅助核算(${check.checkName})不能为空`);
              return;
            }
          }
          for (const other of otherFzhsChecks) {
            if (other.isRequire === 1) {
              const val = row.otherValues[other.otherFzhsIdx] || '';
              if (!val.trim()) {
                message.error(`第${i + 1}行：其他辅助核算(${other.displayName || other.checkTypeName})不能为空`);
                return;
              }
            }
          }
        }

        const hasAnyCheck =
          Object.values(row.checkValues).some((v) => v != null) ||
          Object.values(row.otherValues).some((v) => v && v.trim());
        if (hasAnyCheck && (row.amount == null || row.amount <= 0)) {
          message.error(`第${i + 1}行：填写了辅助核算信息，金额不能为空`);
          return;
        }
      }
    }

    const newCheckItems: CheckItem[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasData =
        (row.summary && row.summary.trim()) ||
        Object.values(row.checkValues).some((v) => v != null) ||
        Object.values(row.otherValues).some((v) => v && v.trim()) ||
        row.amount != null;

      if (!hasData) continue;

      const checkValues: Record<number, number> = {};
      for (const [cid, val] of Object.entries(row.checkValues)) {
        if (val != null) checkValues[Number(cid)] = val;
      }

      const infoFzhs: Record<string, string | null> = {};
      const otherInfo: Partial<{
        otherFzhsIdx: number;
        orderNo: string | null;
        orderDate: string | null;
        payTypeId: number | null;
        cheqNo: string | null;
        receiptNo: string | null;
        occurDate: string | null;
      }> = {};

      for (const [idxStr, val] of Object.entries(row.otherValues)) {
        const idx = Number(idxStr);
        if (val && val.trim()) {
          switch (idx) {
            case 1: infoFzhs.infoFzhs1 = val; break;
            case 2: infoFzhs.infoFzhs2 = val; break;
            case 3: infoFzhs.infoFzhs3 = val; break;
            case 4: infoFzhs.infoFzhs4 = val; break;
            case 5: infoFzhs.infoFzhs5 = val; break;
          }
          otherInfo.otherFzhsIdx = idx;

          const otherCfg = otherFzhsChecks.find((o) => o.otherFzhsIdx === idx);
          if (otherCfg) {
            if (otherCfg.checkTypeName === '日期') {
              otherInfo.orderDate = val;
              otherInfo.occurDate = val;
            } else if (otherCfg.checkTypeName === '票据号') {
              otherInfo.cheqNo = val;
              otherInfo.orderNo = val;
            } else if (otherCfg.checkTypeName === '回单号') {
              otherInfo.receiptNo = val;
            }
          }
        }
      }

      const checkItem: CheckItem = {
        acctCheckId: null,
        line: i + 1,
        checkItemType: 'standard',
        summary: row.summary || null,
        amtDebit: row.amount && row.amount > 0 ? row.amount : null,
        amtCredit: row.amount && row.amount < 0 ? Math.abs(row.amount) : null,
        checkValues,
        otherFzhsIdx: otherInfo.otherFzhsIdx ?? null,
        infoFzhs1: infoFzhs.infoFzhs1 || null,
        infoFzhs2: infoFzhs.infoFzhs2 || null,
        infoFzhs3: infoFzhs.infoFzhs3 || null,
        infoFzhs4: infoFzhs.infoFzhs4 || null,
        infoFzhs5: infoFzhs.infoFzhs5 || null,
        orderNo: otherInfo.orderNo || null,
        orderDate: otherInfo.orderDate || null,
        payTypeId: otherInfo.payTypeId || null,
        cheqNo: otherInfo.cheqNo || null,
        receiptNo: otherInfo.receiptNo || null,
        occurDate: otherInfo.occurDate || null,
      };

      newCheckItems.push(checkItem);
    }

    // 计算辅助核算总金额
    const totalCheckAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
    // 回写总金额到分录金额
    if (totalCheckAmount !== 0) {
      const detail = details[detailIndex];
      if (detail.amtDebit != null && detail.amtDebit > 0) {
        updateDetail(detailIndex, { amtDebit: totalCheckAmount, amtCredit: null });
      } else if (detail.amtCredit != null && detail.amtCredit > 0) {
        updateDetail(detailIndex, { amtCredit: Math.abs(totalCheckAmount), amtDebit: null });
      } else {
        updateDetail(detailIndex, { amtDebit: totalCheckAmount > 0 ? totalCheckAmount : null, amtCredit: totalCheckAmount < 0 ? Math.abs(totalCheckAmount) : null });
      }
    }
    updateDetailCheckItems(detailIndex, newCheckItems);
    message.success('辅助核算信息保存成功');
    onClose();
  };

  // Build column definitions
  const allCheckColumns: Array<{
    key: string;
    title: string;
    type: 'standard' | 'other';
    checkId?: number;
    otherIdx?: number;
    inputType?: string;
    dictType?: string;
    isRequire?: number;
    checkTypeName?: string;
  }> = [];
  checks.forEach((c) =>
    allCheckColumns.push({
      key: `std_${c.checkId}`,
      title: c.checkName,
      type: 'standard',
      checkId: c.checkId,
    })
  );
  otherFzhsChecks.forEach((o) =>
    allCheckColumns.push({
      key: `other_${o.otherFzhsIdx}`,
      title: o.displayName || o.checkTypeName || `其他${o.otherFzhsIdx}`,
      type: 'other',
      otherIdx: o.otherFzhsIdx,
      inputType: o.inputType ?? undefined,
      dictType: o.dictType ?? undefined,
      isRequire: o.isRequire,
      checkTypeName: o.checkTypeName,
    })
  );

  // Cell display with 2-line clamp
  const cellTextStyle: React.CSSProperties = {
    cursor: 'text',
    padding: '2px 4px',
    lineHeight: '20px',
    maxHeight: '44px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
  };

  const editingStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: ROW_HEIGHT_PX - 8,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const cellEditClick = (rowIdx: number, colKey: string) => {
    // If clicking on a blank padding row, create a new real row first
    if (rowIdx >= rows.length) {
      const newRow = createBlankRow();
      setRows((prev) => [...prev, newRow]);
      // Need to update editingCell after setRows
      setTimeout(() => setEditingCell({ rowIdx: rows.length, colKey }), 0);
    } else {
      setEditingCell({ rowIdx, colKey });
    }
  };

  /** Ensure a row exists at the given index, creating blank row(s) if needed */
  const ensureRow = (rowIdx: number) => {
    setRows((prev) => {
      if (rowIdx < prev.length) return prev;
      const newRows = [...prev];
      while (newRows.length <= rowIdx) {
        newRows.push(createBlankRow());
      }
      return newRows;
    });
  };

  /** Handle Enter on summary: navigate to next cell */
  const handleSummaryEnter = (rowIdx: number) => {
    if (rowIdx >= rows.length) {
      ensureRow(rowIdx);
    }
    // Determine target cell: first check column, or amount if no checks
    if (allCheckColumns.length > 0) {
      const firstKey = allCheckColumns[0].key;
      // Need to wait for setRows to complete before setting editingCell
      setTimeout(() => {
        setEditingCell({ rowIdx, colKey: firstKey });
      }, 0);
      if (allCheckColumns[0].type === 'standard') {
        setTimeout(() => setOpenAutoDropdown(firstKey), 50);
      }
    } else {
      setTimeout(() => setEditingCell({ rowIdx, colKey: 'amount' }), 0);
    }
  };

  /** Navigate to the next row's summary cell */
  const goToNextRowSummary = (rowIdx: number) => {
    const nextRow = rowIdx + 1;
    ensureRow(nextRow);
    setTimeout(() => setEditingCell({ rowIdx: nextRow, colKey: 'summary' }), 0);
  };

  /** Handle Enter key on any cell to navigate */
  const handleCellEnter = (rowIdx: number, colKey: string) => {
    const currentIdx = allCheckColumns.findIndex(c => c.key === colKey);
    if (currentIdx >= 0 && currentIdx < allCheckColumns.length - 1) {
      // Move to next check column
      const nextKey = allCheckColumns[currentIdx + 1].key;
      setEditingCell({ rowIdx, colKey: nextKey });
    } else if (currentIdx >= 0) {
      // Last check column: go to amount
      setEditingCell({ rowIdx, colKey: 'amount' });
    } else {
      // On amount: go to next row summary
      setOpenAutoDropdown(null);
      goToNextRowSummary(rowIdx);
    }
  };

  const columns = [
    {
      title: () => (
        <Checkbox
          checked={selectedRowKeys.length === displayRows.filter((r) => rows.some((rr) => rr.rowId === r.rowId)).length && selectedRowKeys.length > 0}
          indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < displayRows.filter((r) => rows.some((rr) => rr.rowId === r.rowId)).length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys(rows.map((r) => r.rowId));
            } else {
              setSelectedRowKeys([]);
            }
          }}
        />
      ),
      dataIndex: 'rowId',
      key: 'selection',
      width: 40,
      fixed: 'left' as const,
      render: (_: any, record: any, rowIdx: number) => {
        // Only show checkbox for real rows (not blank padding beyond actual rows)
        const isRealRow = rowIdx < rows.length;
        if (!isRealRow) return null;
        return (
          <Checkbox
            checked={selectedRowKeys.includes(record.rowId)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRowKeys((prev) => [...prev, record.rowId]);
              } else {
                setSelectedRowKeys((prev) => prev.filter((k) => k !== record.rowId));
              }
            }}
          />
        );
      },
    },
    {
      title: '行号',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 60,
      render: (_: any, __: any, rowIdx: number) => (
        <div style={{ textAlign: 'center', color: '#666' }}>
          {rowIdx + 1}
        </div>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      width: 160,
      ellipsis: true,
      render: (_: any, __: any, rowIdx: number) => {
        const isEditing =
          editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'summary';
        return isEditing ? (
          <Input
            size="small"
            value={rows[rowIdx]?.summary || ''}
            onChange={(e) => updateRow(rowIdx, { summary: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSummaryEnter(rowIdx);
              }
            }}
            onBlur={() => setEditingCell(null)}
            autoFocus
            style={editingStyle}
          />
        ) : (
          <div
            style={cellTextStyle}
            onClick={() => cellEditClick(rowIdx, 'summary')}
          >
            <Tooltip title={rowIdx < rows.length ? (rows[rowIdx]?.summary || '') : ''}>
              <Text style={{ color: (rowIdx < rows.length && rows[rowIdx]?.summary) ? undefined : '#bfbfbf' }}>
                {(rowIdx < rows.length && rows[rowIdx]?.summary) || '摘要'}
              </Text>
            </Tooltip>
          </div>
        );
      },
    },
    ...allCheckColumns.map((colCfg) => ({
      title: (
        <span>
          {colCfg.title}
          {colCfg.isRequire === 1 && <Text style={{ color: '#ff4d4f' }}> *</Text>}
        </span>
      ),
      dataIndex: colCfg.key,
      key: colCfg.key,
      width: 140,
      ellipsis: true,
      render: (_: any, __: any, rowIdx: number) => {
        const isRealRow = rowIdx < rows.length;
        const row = isRealRow ? rows[rowIdx] : null;

        if (colCfg.type === 'standard' && colCfg.checkId != null) {
          if (!isRealRow || !row) {
            return (
              <div
                style={cellTextStyle}
                onClick={() => cellEditClick(rowIdx, colCfg.key)}
              >
                <Text style={{ color: '#bfbfbf' }}>选择${'{colCfg.title}'}</Text>
              </div>
            );
          }
          if (!row) return null;
          const isEditing =
            editingCell?.rowIdx === rowIdx && editingCell?.colKey === colCfg.key;
          const options: CheckOption[] =
            checkState?.checkOptions.get(colCfg.checkId) || [];
          const currentValue = row.checkValues[colCfg.checkId] ?? undefined;

          if (isEditing) {
            return (
              <Select
                size="small"
                showSearch
                style={{ width: 138 }}
                placeholder={`选择${colCfg.title}`}
                value={currentValue}
                onChange={(val) => {
                  const newCV = { ...row.checkValues, [colCfg.checkId!]: val };
                  updateRow(rowIdx, { checkValues: newCV });
                }}
                onBlur={() => setEditingCell(null)}
                autoFocus
                popupMatchSelectWidth={false}
                open={openAutoDropdown === colCfg.key ? true : undefined}
                onDropdownVisibleChange={(visible) => { if (visible) setOpenAutoDropdown(null); }}
                dropdownStyle={{ minWidth: 200, maxWidth: 420 }}
                options={options.map((opt) => ({
                  value: opt.id,
                  label: `${opt.code} ${opt.name}`,
                }))}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCellEnter(rowIdx, colCfg.key);
                  }
                }}
              />
            );
          }

          const selectedOption = options.find((o) => o.id === currentValue);
          return (
            <div
              style={cellTextStyle}
              onClick={() => cellEditClick(rowIdx, colCfg.key)}
            >
              <Tooltip title={selectedOption ? `${selectedOption.code} ${selectedOption.name}` : ''}>
                <Text style={{ color: selectedOption ? undefined : '#bfbfbf' }}>
                  {selectedOption ? `${selectedOption.code} ${selectedOption.name}` : `选择${colCfg.title}`}
                </Text>
              </Tooltip>
            </div>
          );
        }

        if (!row) return null;
          if (colCfg.type === 'other' && colCfg.otherIdx != null) {
          const isEditing =
            editingCell?.rowIdx === rowIdx && editingCell?.colKey === colCfg.key;
          const currentValue = row.otherValues[colCfg.otherIdx] || '';

          const isDictSelect = colCfg.inputType === '4' || colCfg.dictType === '4';
          const isDateType = colCfg.inputType === 'date' || colCfg.checkTypeName === '日期' || colCfg.title.includes('日期');

          if (isEditing) {
            if (isDictSelect) {
              const dictOptions: CheckOption[] =
                checkState?.dictOptions.get(colCfg.otherIdx) || [];
              return (
                <Select
                  size="small"
                  style={{ width: 138 }}
                  placeholder={`选择${colCfg.title}`}
                  value={currentValue || undefined}
                  onChange={(val) => {
                    const newOV = { ...row.otherValues, [colCfg.otherIdx!]: val };
                    updateRow(rowIdx, { otherValues: newOV });
                  }}
                  onBlur={() => setEditingCell(null)}
                  autoFocus
                  popupMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 200, maxWidth: 420 }}
                  showSearch
                  filterOption={(input: string, option: any) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCellEnter(rowIdx, colCfg.key);
                    }
                  }}
                  options={dictOptions.map((opt) => ({
                    value: opt.code || String(opt.id),
                    label: opt.name,
                  }))}
                />
              );
            }
            if (isDateType) {
              return (
                <Input
                  size="small"
                  style={editingStyle}
                  placeholder="日期"
                  value={currentValue}
                  onChange={(e) => {
                    const newOV = { ...row.otherValues, [colCfg.otherIdx!]: e.target.value };
                    updateRow(rowIdx, { otherValues: newOV });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCellEnter(rowIdx, colCfg.key);
                    }
                  }}
                  onBlur={() => setEditingCell(null)}
                  autoFocus
                />
              );
            }
            return (
              <Input
                size="small"
                style={editingStyle}
                placeholder={`输入${colCfg.title}`}
                value={currentValue}
                onChange={(e) => {
                  const newOV = { ...row.otherValues, [colCfg.otherIdx!]: e.target.value };
                  updateRow(rowIdx, { otherValues: newOV });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCellEnter(rowIdx, colCfg.key);
                  }
                }}
                onBlur={() => setEditingCell(null)}
                autoFocus
              />
            );
          }

          return (
            <div
              style={cellTextStyle}
              onClick={() => cellEditClick(rowIdx, colCfg.key)}
            >
              <Tooltip title={currentValue || ''}>
                <Text style={{ color: currentValue ? undefined : '#bfbfbf' }}>
                  {currentValue || `输入${colCfg.title}`}
                </Text>
              </Tooltip>
            </div>
          );
        }

        return null;
      },
    })),
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 200,
      ellipsis: true,
      className: 'amount-col',
      render: (_: any, __: any, rowIdx: number) => {
        const isEditing =
          editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'amount';
        const isRealRow = rowIdx < rows.length;
        const row = isRealRow ? rows[rowIdx] : null;
        if (!row) {
          return (
            <div
              style={{ ...cellTextStyle, textAlign: 'right' }}
              onClick={() => cellEditClick(rowIdx, 'amount')}
            >
              <Text style={{ color: '#bfbfbf' }}>金额</Text>
            </div>
          );
        }

        if (isEditing) {
          return (
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              value={row.amount}
              onChange={(val) => updateRow(rowIdx, { amount: val })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Navigate to next row's summary
                  setEditingCell(null);
                  setTimeout(() => goToNextRowSummary(rowIdx), 50);
                }
              }}
              onBlur={() => setEditingCell(null)}
              autoFocus
              placeholder="金额"
            />
          );
        }

        return (
          <div
            style={{ ...cellTextStyle, textAlign: 'right' }}
            onClick={() => cellEditClick(rowIdx, 'amount')}
          >
            <Text style={{ color: row.amount != null ? undefined : '#bfbfbf' }}>
              {row.amount != null ? formatAmount(row.amount) : '金额'}
            </Text>
          </div>
        );
      },
    },
  ];

  // Calculate totals
  const detailAmount =
    detail
      ? (detail.amtDebit || 0) + (detail.amtCredit || 0)
      : 0;
  const totalAuxAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

  const subjectDisplay = config
    ? `${config.acctSubjCode} ${config.acctSubjNameAll || config.acctSubjName || ''}`
    : detail?.acctSubjCode || '';

  return (
    <Modal
      title={
        <div style={{ position: 'relative', fontSize: 14 }}>
          <Text strong>辅助核算</Text>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingRight: 28 }}>
            <span>科目：{subjectDisplay}</span>
            <span>分录金额：{formatAmount(detailAmount)} | 辅助核算总金额：{formatAmount(totalAuxAmount)}</span>
          </div>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => setIsFullscreen(!isFullscreen)}
            size="small"
            style={{ position: 'absolute', top: -4, right: -4 }}
          />
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={isFullscreen ? '98vw' : 1200}
      wrapClassName={isFullscreen ? 'aux-modal-fullscreen' : ''}
      closeIcon={null}
      style={isFullscreen ? { top: 8, maxWidth: '98vw' } : undefined}
      styles={{
        body: {
          maxHeight: isFullscreen ? 'none' : 'calc(80vh - 120px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px 12px 32px',
        },
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <Upload
              accept=".csv,.txt"
              showUploadList={false}
              beforeUpload={handleFileImport}
            >
              <Tooltip title="导入Excel(CSV)">
                <Button icon={<UploadOutlined />} size="small" />
              </Tooltip>
            </Upload>
            <Tooltip title="添加行">
              <Button icon={<PlusOutlined />} size="small" onClick={addRow} />
            </Tooltip>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={batchDelete}
                />
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => setShowBatchEdit(true)}
                />
              </>
            )}
          </Space>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleConfirm}>
              确认
            </Button>
          </Space>
        </div>
      }
    >
      {/* Batch edit panel */}
      {showBatchEdit && (
        <div style={{
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 4,
          padding: '8px 12px',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <Text strong style={{ fontSize: 12, whiteSpace: 'nowrap' }}>批量修改（{selectedRowKeys.length}行）：</Text>
          {/* Summary */}
          <Input
            size="small"
            style={{ width: 140 }}
            placeholder="新摘要"
            value={batchEditValues['summary'] || ''}
            onChange={(e) => setBatchEditValues(prev => ({ ...prev, summary: e.target.value }))}
          />
          {/* Standard check columns */}
          {allCheckColumns.filter(c => c.type === 'standard').map(col => {
            const check = checks.find(c => c.checkId === col.checkId);
            if (!check) return null;
            const options = checkState?.checkOptions.get(check.checkId) || [];
            const valKey = `std_${check.checkId}`;
            return (
              <Select
                key={valKey}
                size="small"
                style={{ width: 130 }}
                placeholder={col.title}
                allowClear
                value={batchEditValues[valKey] || undefined}
                onChange={(val) => setBatchEditValues(prev => ({ ...prev, [valKey]: val || '' }))}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={options.map((opt: CheckOption) => ({
                  value: opt.id,
                  label: `${opt.code} ${opt.name}`,
                }))}
              />
            );
          })}
          {/* Other fzhs columns */}
          {allCheckColumns.filter(c => c.type === 'other').map(col => {
            const other = otherFzhsChecks.find(o => o.otherFzhsIdx === col.otherIdx);
            const valKey = `other_${col.otherIdx}`;
            const isSelect = other?.inputType === '4';
            const dictOptions = isSelect ? (checkState?.dictOptions.get(col.otherIdx!) || []) : [];
            return (
              <div key={valKey} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                {isSelect ? (
                  <Select
                    size="small"
                    style={{ width: 130 }}
                    placeholder={col.title}
                    allowClear
                    value={batchEditValues[valKey] || undefined}
                    onChange={(val) => setBatchEditValues(prev => ({ ...prev, [valKey]: val || '' }))}
                    showSearch
                    filterOption={(input: string, option: any) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={dictOptions.map((opt: CheckOption) => ({
                      value: opt.code || String(opt.id),
                      label: opt.name,
                    }))}
                  />
                ) : (
                  <Input
                    size="small"
                    style={{ width: 130 }}
                    placeholder={col.title}
                    value={batchEditValues[valKey] || ''}
                    onChange={(e) => setBatchEditValues(prev => ({ ...prev, [valKey]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
          {/* Amount */}
          <InputNumber
            size="small"
            style={{ width: 140 }}
            placeholder="新金额"
            min={0}
            precision={2}
            value={batchEditValues['amount'] ?? null}
            onChange={(val) => setBatchEditValues(prev => ({ ...prev, amount: val }))}
          />
          <Button type="primary" size="small" onClick={applyBatchEdit}>
            应用
          </Button>
          <Button size="small" onClick={() => setShowBatchEdit(false)}>
            取消
          </Button>
        </div>
      )}

      <div style={{ minHeight: MIN_TABLE_ROWS * ROW_HEIGHT_PX + 10 }}>
        <style>{`
          .aux-modal-fullscreen .ant-modal {
            height: calc(100vh - 16px) !important;
          }
          .aux-modal-fullscreen .ant-modal-content {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .aux-modal-fullscreen .ant-modal-body {
            flex: 1;
            overflow: hidden !important;
          }
          .aux-modal-fullscreen .ant-modal-body > div:last-child {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .aux-modal-fullscreen .ant-modal-body .ant-table-wrapper {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .aux-modal-fullscreen .ant-modal-body .ant-table-wrapper .ant-table {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .aux-modal-fullscreen .ant-modal-body .ant-table-wrapper .ant-table-container {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .aux-modal-fullscreen .ant-modal-body .ant-table-wrapper .ant-table-container > .ant-table-body {
            flex: 1;
            overflow-y: auto !important;
          }
          .aux-modal-fullscreen .ant-modal-body .ant-table-wrapper .ant-table-container > .ant-table-header {
            flex-shrink: 0;
          }
          .aux-modal-table .ant-table {
            table-layout: fixed !important;
          }
          .aux-modal-table .ant-table-tbody > tr > td {
            overflow: hidden !important;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-select {
            max-width: 100% !important;
            overflow: hidden;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-select-selector {
            max-width: 100% !important;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-select-selection-item,
          .aux-modal-table .ant-table-tbody > tr > td .ant-select-selection-placeholder {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-input-affix-wrapper {
            max-width: 100%;
          }
          .aux-modal-table .ant-table-thead > tr > th:first-child,
          .aux-modal-table .ant-table-tbody > tr > td:first-child {
            text-align: center !important;
            vertical-align: middle !important;
          }
          .aux-modal-table .amount-col {
            text-align: right !important;
          }
          .aux-modal-table .ant-table-thead > tr > th {
            padding: 4px 6px !important;
            font-weight: 500;
            font-size: 12px;
            background: #fafafa;
          }
          .aux-modal-table .ant-table-tbody > tr > td {
            padding: 1px 2px !important;
            height: ${ROW_HEIGHT_PX}px;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-input,
          .aux-modal-table .ant-table-tbody > tr > td .ant-input-number,
          .aux-modal-table .ant-table-tbody > tr > td .ant-select,
          .aux-modal-table .ant-table-tbody > tr > td .ant-select-selector {
            height: ${ROW_HEIGHT_PX - 8}px !important;
            min-height: ${ROW_HEIGHT_PX - 8}px;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-input-number input {
            height: ${ROW_HEIGHT_PX - 8}px;
          }
          .aux-modal-table .ant-select-single .ant-select-selector {
            padding: 0 4px;
            max-width: 138px !important;
          }
          .aux-modal-table .ant-select-single.ant-select-open {
            width: 138px !important;
          }
          .aux-modal-table .ant-select-selection-item,
          .aux-modal-table .ant-table-tbody > tr > td .ant-select-selection-placeholder {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .aux-modal-table .ant-table-tbody > tr > td .ant-input-number {
            width: 100% !important;
          }
          .aux-modal-table .ant-table {
            font-size: 12px;
          }
          .aux-modal-table .ant-table-body {
            overflow-x: auto !important;
          }
        `}</style>
        <Table
          className="aux-modal-table"
          dataSource={displayRows.map((r, i) => ({ ...r, key: r.rowId, rowIndex: i }))}
          columns={columns}
          pagination={false}
          size="small"
          bordered
          scroll={{ y: tableScrollY, x: 'max-content' }}
          rowKey="rowId"
          rowClassName={(_, index) => (index < rows.length ? '' : 'aux-blank-row')}
        />
      </div>
    </Modal>
  );
};

export default AuxAccountingModal;