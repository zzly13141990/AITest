import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Table, Input, InputNumber, Select, Typography, Tooltip } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined, DeleteOutlined, UpOutlined, SearchOutlined } from '@ant-design/icons';
import { useVouchStore } from '../store/vouchStore';
import type { VouchDetail, CheckTypeInfo, OtherFzhsInfo, CheckOption, SubjSearchResult } from '../types/vouch';
import { numberToChinese } from '../utils/numberToChinese';

const { Text } = Typography;

const COL_SUMMARY = 'summary';
const COL_SUBJECT = 'subject';
const COL_DEBIT = 'debit';
const COL_CREDIT = 'credit';

type EditCol = typeof COL_SUMMARY | typeof COL_SUBJECT | typeof COL_DEBIT | typeof COL_CREDIT | `check-${number}`;

const ROW_HEIGHT_PX = 56;
const MAX_VISIBLE_ROWS = 6;

const DetailTable: React.FC = () => {
  const {
    details,
    addDetailBelow,
    removeDetail,
    updateDetail,
    searchSubjects,
    subjectSearchResults,
    subjectSearching,
    detailCheckStates,
    hoverRow,
    setHoverRow,
    expandedCheckRows,
    toggleExpandedCheckRow,
    setActiveCell,
    activeCell,
    selectedRow,
    setSelectedRow,
    loadTopSubjects,
    loadSubjChecks,
    readonly,
  } = useVouchStore();

  const [localSearchKeyword, setLocalSearchKeyword] = useState<Record<number, string>>({});
  const [localSearchResults, setLocalSearchResults] = useState<Record<number, SubjSearchResult[]>>({});
  const [localSubjectOpen, setLocalSubjectOpen] = useState<Record<number, boolean>>({});
  const [editingCell, setEditingCell] = useState<{ row: number; col: EditCol } | null>(null);
  const [subjectSearchTimer, setSubjectSearchTimer] = useState<Record<number, ReturnType<typeof setTimeout> | null>>({});
  const inputRefs = useRef<Record<string, any>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [cachedSubjects, setCachedSubjects] = useState<SubjSearchResult[]>([]);
  const [openCheckDropdowns, setOpenCheckDropdowns] = useState<Record<string, boolean>>({});

  // Pre-load subjects on mount for instant local search
  useEffect(() => {
    loadTopSubjects(9999);
  }, []);

  // Sync store's subjectSearchResults into localSearchResults and cache
  useEffect(() => {
    if (subjectSearchResults.length > 0) {
      setCachedSubjects(subjectSearchResults);
    }
    if (activeCell && activeCell.col === COL_SUBJECT) {
      const idx = activeCell.row;
      if (!localSearchKeyword[idx]) {
        setLocalSearchResults((prev) => ({ ...prev, [idx]: subjectSearchResults }));
      }
    }
  }, [subjectSearchResults, activeCell, localSearchKeyword]);

  // Click outside table body to exit edit mode
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell && tableRef.current) {
        const target = e.target as Node;
        // Ignore clicks on Ant Design portal elements (Select dropdown, Picker, etc.)
        // These are rendered at document.body level and would falsely trigger close
        if (target instanceof HTMLElement && target.closest('.ant-select-dropdown, .ant-picker-dropdown, .ant-dropdown')) return;
        if (!tableRef.current.contains(target)) {
          setEditingCell(null);
          setActiveCell(null);
          setOpenCheckDropdowns({});
          setTimeout(() => setActiveCheckPopupRow(null), 50);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell, setActiveCell]);

  const focusInput = useCallback((row: number, col: EditCol) => {
    const key = `${row}-${col}`;
    setTimeout(() => {
      const el = inputRefs.current[key];
      if (el) {
        if (el.focus) el.focus();
      }
    }, 50);
  }, []);

  // Track position of each subject cell for floating check panel
  const [subjectCellPositions, setSubjectCellPositions] = useState<Record<number, { top: number; left: number; width: number }>>({});
  const [activeCheckPopupRow, setActiveCheckPopupRow] = useState<number | null>(null);
  const subjectCellRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (activeCell) {
      focusInput(activeCell.row, activeCell.col as EditCol);
    }
  }, [activeCell, focusInput]);

  // Update subject cell positions after render
  useEffect(() => {
    const positions: Record<number, { top: number; left: number; width: number }> = {};
    Object.entries(subjectCellRefs.current).forEach(([idx, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const wrapperRect = wrapperRef.current?.getBoundingClientRect();
        if (wrapperRect) {
          positions[Number(idx)] = {
            top: rect.bottom - wrapperRect.top,
            left: rect.left - wrapperRect.left,
            width: rect.width,
          };
        }
      }
    });
    // Merge with previous positions so rows temporarily without refs
    // (e.g., in edit mode where Select replaces the display div) keep
    // their last known position. Otherwise the popup would lose its anchor.
    setSubjectCellPositions(prev => ({ ...prev, ...positions }));
  }, [activeCell, details]);

  // Show check popup when subject with checks is resolved
  // Only close popup when user navigates away from check columns or to a row without checks
  // Never re-open popup automatically when entering subject edit mode
  useEffect(() => {
    if (activeCell) {
      // If we're on the subject column, don't touch the popup state
      // (handleCellClick already closes it)
      if (activeCell.col === COL_SUBJECT) {
        return;
      }
      // If we're on a check column, keep the popup open
      if (activeCell.col.startsWith('check-')) {
        setActiveCheckPopupRow(activeCell.row);
        return;
      }
      // If we're on debit/credit/summary and the current popup row has no checks, close it
      if (activeCheckPopupRow !== null) {
        const checkState = detailCheckStates.get(activeCheckPopupRow);
        const allChecks = [
          ...(checkState?.subjConfig?.checks || []),
          ...(checkState?.subjConfig?.otherFzhsChecks || []),
        ];
        if (allChecks.length === 0) {
          setActiveCheckPopupRow(null);
        }
      }
    }
  }, [activeCell]);

  // Close check popup - first close all dropdowns, then close the layer
  const closeCheckPopup = useCallback(() => {
    setOpenCheckDropdowns({});
    setTimeout(() => {
      setActiveCheckPopupRow(null);
      if (activeCell) {
        setEditingCell({ row: activeCell.row, col: COL_DEBIT });
        setActiveCell({ row: activeCell.row, col: COL_DEBIT });
      }
    }, 50);
  }, [activeCell]);

  // Auto-open first check dropdown when check popup appears, auto-open on focus
  useEffect(() => {
    if (activeCell && activeCell.col.startsWith('check-')) {
      setOpenCheckDropdowns({ [`${activeCell.row}-${activeCell.col}`]: true });
    } else {
      setOpenCheckDropdowns({});
    }
  }, [activeCell]);

  const handleSubjectSearch = useCallback((index: number, keyword: string) => {
    setLocalSearchKeyword((prev) => ({ ...prev, [index]: keyword }));

    if (subjectSearchTimer[index]) {
      clearTimeout(subjectSearchTimer[index]!);
    }

    const timer = setTimeout(() => {
      if (!keyword || keyword.length < 1) {
        setLocalSearchResults((prev) => ({ ...prev, [index]: cachedSubjects }));
      } else {
        const kw = keyword.toLowerCase();
        const filtered = cachedSubjects.filter(
          (s) =>
            s.acctSubjCode.toLowerCase().includes(kw) ||
            s.acctSubjName.toLowerCase().includes(kw)
        );
        setLocalSearchResults((prev) => ({ ...prev, [index]: filtered }));
      }
    }, 100);

    setSubjectSearchTimer((prev) => ({ ...prev, [index]: timer }));
  }, [cachedSubjects, subjectSearchTimer]);

  /** Get isBudg flag for a detail row; returns null if no subject or config not loaded */
  const getRowIsBudg = useCallback((index: number): string | null => {
    const detail = details[index];
    if (!detail?.acctSubjCode) return null;
    const checkState = detailCheckStates.get(index);
    return checkState?.subjConfig?.isBudg ?? null;
  }, [details, detailCheckStates]);

  /** Compute totalDebit and totalCredit for rows with the same isBudg, excluding current index */
  const getGroupTotals = useCallback((index: number, isBudg: string) => {
    let totalDebit = 0;
    let totalCredit = 0;
    for (let i = 0; i < details.length; i++) {
      if (i === index) continue;
      const row = details[i];
      if (!row?.acctSubjCode) continue;
      const checkState = detailCheckStates.get(i);
      const rowIsBudg = checkState?.subjConfig?.isBudg;
      if (rowIsBudg === isBudg) {
        totalDebit += row.amtDebit || 0;
        totalCredit += row.amtCredit || 0;
      }
    }
    return { totalDebit, totalCredit };
  }, [details, detailCheckStates]);

  const getNextAmountCol = useCallback((index: number): EditCol => {
    const detail = details[index];
    const creditHasValue = detail?.amtCredit != null && detail.amtCredit > 0;
    return creditHasValue ? COL_CREDIT : COL_DEBIT;
  }, [details]);

  const navigateToChecksOrAmount = useCallback((index: number) => {
    loadSubjChecks(index).then(() => {
      const updatedState = useVouchStore.getState().detailCheckStates.get(index);
      const config = updatedState?.subjConfig;
      const totalChecks = (config?.checks.length || 0) + (config?.otherFzhsChecks.length || 0);
      if (totalChecks > 0) {
        setActiveCheckPopupRow(index);
        setEditingCell({ row: index, col: 'check-0' });
        setActiveCell({ row: index, col: 'check-0' });
      } else {
        const nextCol = getNextAmountCol(index);
        setActiveCheckPopupRow(null);
        setEditingCell({ row: index, col: nextCol });
        setActiveCell({ row: index, col: nextCol });
      }
    });
  }, [loadSubjChecks, setActiveCell, getNextAmountCol]);

  const handleSubjectSelect = useCallback((index: number, val: string) => {
    updateDetail(index, { acctSubjCode: val });
    setLocalSearchKeyword((prev) => ({ ...prev, [index]: '' }));
    setLocalSearchResults((prev) => ({ ...prev, [index]: [] }));
    setLocalSubjectOpen((prev) => ({ ...prev, [index]: false }));

    navigateToChecksOrAmount(index);
  }, [updateDetail, navigateToChecksOrAmount]);

  const handleCellClick = useCallback((row: number, col: EditCol) => {
    if (readonly) return;
    setOpenCheckDropdowns({});
    // Close existing popup synchronously before potentially reopening below
    setActiveCheckPopupRow(null);
    setEditingCell({ row, col });
    setActiveCell({ row, col });
    setSelectedRow(row);
    // Load top 50 subjects when entering subject edit mode
    if (col === COL_SUBJECT) {
      loadTopSubjects();
    }
    setTimeout(() => {
      const el = inputRefs.current[`${row}-${col}`];
      if (el) {
        if (el.focus) el.focus();
        if (el.select && col !== COL_SUBJECT) {
          el.select();
        }
      }
    }, 50);
  }, [setActiveCell, setSelectedRow, loadTopSubjects, details, detailCheckStates, loadSubjChecks, readonly]);

  const handleRowClick = useCallback((rowIndex: number) => {
    setSelectedRow(selectedRow === rowIndex ? null : rowIndex);
  }, [selectedRow, setSelectedRow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: EditCol) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (col === COL_SUMMARY) {
        setEditingCell({ row, col: COL_SUBJECT });
        setActiveCell({ row, col: COL_SUBJECT });
      } else if (col === COL_SUBJECT) {
        const detail = details[row];
        if (detail?.acctSubjCode) {
          setLocalSubjectOpen((prev) => ({ ...prev, [row]: false }));
          navigateToChecksOrAmount(row);
        } else {
          const nextCol = getNextAmountCol(row);
          setActiveCheckPopupRow(null);
          setEditingCell({ row, col: nextCol });
          setActiveCell({ row, col: nextCol });
        }
      } else if (col === COL_DEBIT) {
        const d = details[row];
        // Debit empty Enter → Credit (same row); Debit has value → next row summary
        if (d?.amtDebit == null) {
          setEditingCell({ row, col: COL_CREDIT });
          setActiveCell({ row, col: COL_CREDIT });
        } else if (row < details.length - 1) {
          const nextDetail = details[row + 1];
          if (!nextDetail?.summary && details[row]?.summary) {
            updateDetail(row + 1, { summary: details[row].summary as string });
          }
          setEditingCell({ row: row + 1, col: COL_SUMMARY });
          setActiveCell({ row: row + 1, col: COL_SUMMARY });
        }
      } else if (col === COL_CREDIT) {
        // Credit Enter → next row's summary; copy previous summary if empty
        if (row < details.length - 1) {
          const nextDetail = details[row + 1];
          if (!nextDetail?.summary && details[row]?.summary) {
            updateDetail(row + 1, { summary: details[row].summary as string });
          }
          setEditingCell({ row: row + 1, col: COL_SUMMARY });
          setActiveCell({ row: row + 1, col: COL_SUMMARY });
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setActiveCell(null);
      setActiveCheckPopupRow(null);
    }
  }, [details, updateDetail, setActiveCell, navigateToChecksOrAmount, setActiveCheckPopupRow, closeCheckPopup, getNextAmountCol]);

  const navigateAfterCheck = useCallback((row: number) => {
    setActiveCheckPopupRow(null);
    const nextCol = getNextAmountCol(row);
    setEditingCell({ row, col: nextCol });
    setActiveCell({ row, col: nextCol });
  }, [setActiveCell, getNextAmountCol]);

  const handleCheckKeyDown = useCallback((e: React.KeyboardEvent, row: number, checkIndex: number, totalChecks: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (checkIndex < totalChecks - 1) {
        setActiveCell({ row, col: `check-${checkIndex + 1}` });
      } else {
        navigateAfterCheck(row);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (checkIndex < totalChecks - 1) {
        setActiveCell({ row, col: `check-${checkIndex + 1}` });
      } else {
        navigateAfterCheck(row);
      }
    }
  }, [details, setActiveCell, navigateAfterCheck]);

  // Compute auxiliary accounting display text for a subject cell
  const getSubjectDisplayText = useCallback((index: number) => {
    const detail = details[index];
    if (!detail?.acctSubjCode) return '';

    const checkState = detailCheckStates.get(index);
    const subjNameAll = checkState?.subjConfig?.acctSubjNameAll || '';

    // If subjConfig not loaded yet, try to find from cached search results
    let displayName = subjNameAll;
    if (!displayName) {
      const subjName = checkState?.subjConfig?.acctSubjName || '';
      displayName = subjName;
      if (!displayName) {
        const cached = cachedSubjects.find((s) => s.acctSubjCode === detail.acctSubjCode);
        if (cached) {
          displayName = cached.acctSubjNameAll || cached.acctSubjName;
        }
      }
    }

    let text = `${detail.acctSubjCode} ${displayName}`;

    // Append auxiliary accounting info
    const checkItems = detail.checkItems || [];
    for (const ci of checkItems) {
      if (ci.checkItemType === 'standard' && ci.checkValues) {
        for (const [checkIdStr, optionId] of Object.entries(ci.checkValues)) {
          const checkId = Number(checkIdStr);
          const checkType = checkState?.subjConfig?.checks.find((c) => c.checkId === checkId);
          const options = checkState?.checkOptions.get(checkId) || [];
          const option = options.find((o) => o.id === optionId);
          const checkName = checkType?.checkName || '';
          const optionName = option ? `${option.code}-${option.name}` : '';
          if (checkName && optionName) {
            text += `【${checkName}-${optionName}】`;
          }
        }
      }
    }

    return text;
  }, [details, detailCheckStates, cachedSubjects]);

  const totalDebit = details.reduce((sum, d) => sum + (d.amtDebit || 0), 0);
  const totalCredit = details.reduce((sum, d) => sum + (d.amtCredit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const columns = [
    // Column 0: Edit column
    {
      title: '',
      key: 'edit',
      width: 28,
      className: 'edit-col',
      render: (_: any, __: VouchDetail, index: number) => {
        const isHovered = hoverRow === index;
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            opacity: (isHovered && !readonly) ? 1 : 0,
            transition: 'opacity 0.1s',
            height: '100%',
          }}>
            {!readonly && (
              <>
                <span
                  style={{ cursor: 'pointer', color: '#1677ff', fontSize: 13, lineHeight: 1.2, padding: '1px 0' }}
                  onClick={(e) => { e.stopPropagation(); addDetailBelow(index); }}
                  title="在下方插入行"
                >
                  <PlusOutlined />
                </span>
                <span
                  style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: 13, lineHeight: 1.2, padding: '1px 0' }}
                  onClick={(e) => { e.stopPropagation(); removeDetail(index); }}
                  title="删除该行"
                >
                  <DeleteOutlined />
                </span>
              </>
            )}
          </div>
        );
      },
    },
    // Column 1: Row number
    {
      title: '',
      key: 'rowNum',
      width: 35,
      className: 'row-num-col',
      render: (_: any, __: VouchDetail, index: number) => (
        <Text type="secondary" style={{ fontSize: 12, userSelect: 'none', textAlign: 'center', display: 'block' }}>
          {index + 1}
        </Text>
      ),
    },
    // Column 2: Summary (摘要) - auto line wrap with ellipsis on overflow
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      width: 220,
      ellipsis: true,
      render: (_: any, record: VouchDetail, index: number) => {
        const isEditing = editingCell?.row === index && editingCell?.col === COL_SUMMARY;
        const isActive = activeCell?.row === index && activeCell?.col === COL_SUMMARY;

        if (isEditing || isActive) {
          return (
            <Input.TextArea
              ref={(el: any) => { inputRefs.current[`${index}-${COL_SUMMARY}`] = el; }}
              size="small"
              value={details[index]?.summary || ''}
              onChange={(e) => updateDetail(index, { summary: e.target.value })}
              placeholder="摘要"
              onKeyDown={(e) => handleKeyDown(e, index, COL_SUMMARY)}
              variant="borderless"
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ background: '#e6f7ff', width: '100%', resize: 'none', padding: '2px 4px' }}
            />
          );
        }

        const summaryText = record.summary || '';
        return (
          <Tooltip title={summaryText}>
            <div
              style={{
                cursor: 'text',
                minHeight: 24,
                padding: '2px 4px',
                borderRadius: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onClick={() => handleCellClick(index, COL_SUMMARY)}
            >
              <Text style={{ color: summaryText ? undefined : '#bfbfbf' }}>
                {summaryText || '摘要'}
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    // Column 3: Subject (科目)
    {
      title: '科目',
      dataIndex: 'acctSubjCode',
      key: 'acctSubjCode',
      width: 300,
      render: (_: any, record: VouchDetail, index: number) => {
        const isEditing = editingCell?.row === index && editingCell?.col === COL_SUBJECT;
        const isActive = activeCell?.row === index && activeCell?.col === COL_SUBJECT;
        const results = localSearchResults[index] || [];

        if (isEditing || isActive) {
          return (
            <Select
              ref={(el: any) => { inputRefs.current[`${index}-${COL_SUBJECT}`] = el; }}
              size="small"
              showSearch
              style={{ width: '100%', height: '100%' }}
              value={details[index]?.acctSubjCode || undefined}
              onChange={(val) => handleSubjectSelect(index, val)}
              onSearch={(val) => handleSubjectSearch(index, val)}
              onDropdownVisibleChange={(visible) => {
                if (visible) {
                  loadTopSubjects();
                }
                setLocalSubjectOpen((prev) => ({ ...prev, [index]: visible }));
              }}
              getPopupContainer={() => document.body}
              placeholder="搜索科目"
              notFoundContent={subjectSearching ? '搜索中...' : '请输入关键词搜索'}
              filterOption={false}
              loading={subjectSearching}
              options={results.map((s: SubjSearchResult) => ({
                value: s.acctSubjCode,
                label: `${s.acctSubjCode} ${s.acctSubjNameAll || s.acctSubjName}${s.isLast !== '1' ? ' (非末级)' : ''}`,
              }))}
              suffixIcon={<SearchOutlined />}
              dropdownStyle={{ zIndex: 1050 }}
              variant="borderless"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // When dropdown is open, Enter triggers option selection (handled by onChange)
                  // Only navigate directly when dropdown is closed (user confirming existing value)
                  if (!localSubjectOpen[index]) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKeyDown(e as unknown as React.KeyboardEvent, index, COL_SUBJECT);
                  } else {
                    setLocalSubjectOpen((prev) => ({ ...prev, [index]: false }));
                  }
                }
              }}
            />
          );
        }

        const displayText = getSubjectDisplayText(index);

        return (
          <Tooltip title={displayText || ''}>
            <div
              ref={(el) => { subjectCellRefs.current[index] = el; }}
              style={{
                cursor: 'text', minHeight: 24, padding: '2px 4px', borderRadius: 2,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                wordBreak: 'break-all',
              }}
              onClick={() => handleCellClick(index, COL_SUBJECT)}
            >
              <Text style={{ color: record.acctSubjCode ? undefined : '#bfbfbf' }}>
                {displayText || '科目'}
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    // Column 4: Debit amount (借方金额)
    {
      title: '借方金额',
      dataIndex: 'amtDebit',
      key: 'amtDebit',
      width: 200,
      render: (_: any, record: VouchDetail, index: number) => {
        const isEditing = editingCell?.row === index && editingCell?.col === COL_DEBIT;
        const isActive = activeCell?.row === index && activeCell?.col === COL_DEBIT;

        if (isEditing || isActive) {
          return (
            <InputNumber
              ref={(el: any) => { inputRefs.current[`${index}-${COL_DEBIT}`] = el; }}
              size="small"
              precision={2}
              value={details[index]?.amtDebit}
              onChange={(val) => {
                updateDetail(index, { amtDebit: val });
                if (val && val > 0) updateDetail(index, { amtCredit: null });
              }}
              placeholder="借方"
              onKeyDown={(e) => {
                if (e.key === '=') {
                  e.preventDefault();
                  const rowBudg = getRowIsBudg(index);
                  // Skip if no subject selected on current row
                  if (rowBudg == null) return;
                  const { totalDebit, totalCredit } = getGroupTotals(index, rowBudg);
                  const balance = totalCredit - totalDebit;
                  updateDetail(index, { amtDebit: balance, amtCredit: null });
                  return;
                }
                handleKeyDown(e, index, COL_DEBIT);
              }}
              variant="borderless"
              style={{ background: '#e6f7ff', width: '100%', height: '100%' }}
            />
          );
        }
        const val = record.amtDebit;
        const isNegative = val != null && val < 0;
        return (
          <div
            style={{
              cursor: 'text', minHeight: 24, padding: '2px 4px', textAlign: 'right', borderRadius: 2,
            }}
            onClick={() => handleCellClick(index, COL_DEBIT)}
          >
            <Text style={{ color: isNegative ? '#ff4d4f' : (val ? undefined : '#bfbfbf') }}>
              {val != null ? new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) : ''}
            </Text>
          </div>
        );
      },
    },
    // Column 5: Credit amount (贷方金额)
    {
      title: '贷方金额',
      dataIndex: 'amtCredit',
      key: 'amtCredit',
      width: 200,
      render: (_: any, record: VouchDetail, index: number) => {
        const isEditing = editingCell?.row === index && editingCell?.col === COL_CREDIT;
        const isActive = activeCell?.row === index && activeCell?.col === COL_CREDIT;

        if (isEditing || isActive) {
          return (
            <InputNumber
              ref={(el: any) => { inputRefs.current[`${index}-${COL_CREDIT}`] = el; }}
              size="small"
              precision={2}
              value={details[index]?.amtCredit}
              onChange={(val) => {
                updateDetail(index, { amtCredit: val });
                if (val && val > 0) updateDetail(index, { amtDebit: null });
              }}
              placeholder="贷方"
              onKeyDown={(e) => {
                if (e.key === '=') {
                  e.preventDefault();
                  const rowBudg = getRowIsBudg(index);
                  // Skip if no subject selected on current row
                  if (rowBudg == null) return;
                  const { totalDebit, totalCredit } = getGroupTotals(index, rowBudg);
                  const balance = totalDebit - totalCredit;
                  updateDetail(index, { amtCredit: balance, amtDebit: null });
                  return;
                }
                handleKeyDown(e, index, COL_CREDIT);
              }}
              variant="borderless"
              style={{ background: '#e6f7ff', width: '100%', height: '100%' }}
            />
          );
        }
        const val = record.amtCredit;
        const isNegative = val != null && val < 0;
        return (
          <div
            style={{
              cursor: 'text', minHeight: 24, padding: '2px 4px', textAlign: 'right', borderRadius: 2,
            }}
            onClick={() => handleCellClick(index, COL_CREDIT)}
          >
            <Text style={{ color: isNegative ? '#ff4d4f' : (val ? undefined : '#bfbfbf') }}>
              {val != null ? new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) : ''}
            </Text>
          </div>
        );
      },
    },
  ];

  // Navigate to debit/credit after last check, close popup
  // Render the floating auxiliary accounting popup below subject cell
  const renderFloatingCheckPopup = () => {
    if (activeCheckPopupRow === null) return null;

    const pos = subjectCellPositions[activeCheckPopupRow];
    if (!pos) return null;

    const checkState = detailCheckStates.get(activeCheckPopupRow);
    const config = checkState?.subjConfig;
    if (!config) return null;

    const allChecks: Array<{ type: 'standard' | 'other'; check: CheckTypeInfo | OtherFzhsInfo; idx: number }> = [];
    config.checks.forEach((c, i) => allChecks.push({ type: 'standard', check: c, idx: i }));
    config.otherFzhsChecks.forEach((o, i) => allChecks.push({ type: 'other', check: o, idx: config.checks.length + i }));

    if (allChecks.length === 0) return null;

    const checkItems = details[activeCheckPopupRow]?.checkItems || [];
    // 标准辅助核算应合并到同一个 CheckItem 中，所有 check type 共享一条记录
    const existingStandardCheckItemIndex = checkItems.findIndex(
      (ci) => ci.checkItemType === 'standard'
    );
    const hasStandardCheckItem = existingStandardCheckItemIndex >= 0;
    const existingOtherIdxs = new Set(
      checkItems
        .filter((ci) => ci.checkItemType === 'other')
        .map((ci) => ci.otherFzhsIdx)
        .filter((v): v is number => v !== null)
    );

    const isLastCheck = (globalIdx: number) => globalIdx === allChecks.length - 1;

    const popupStyle: React.CSSProperties = {
      position: 'absolute',
      top: pos.top + 2,
      left: pos.left,
      width: Math.max(pos.width, 420),
      background: '#fff',
      border: '1px solid #d9d9d9',
      borderRadius: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      padding: '8px 12px',
    };

    const rowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 12,
      whiteSpace: 'nowrap',
      width: 80,
      textAlign: 'right',
      flexShrink: 0,
    };

    const inputStyle: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
    };

    const LABEL_WIDTH = 80;

    return (
      <div style={popupStyle} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingLeft: LABEL_WIDTH }}>
          <Text strong style={{ fontSize: 12, flex: 1 }}>{config.acctSubjCode} {config.acctSubjNameAll || config.acctSubjName} - 辅助核算</Text>
          <span style={{ cursor: 'pointer', color: '#999', fontSize: 16, lineHeight: 1 }} onClick={closeCheckPopup}>&times;</span>
        </div>
        {allChecks.map((item, globalIdx) => {
          const checkCol = `check-${globalIdx}`;
          const isActiveCheck = activeCell?.row === activeCheckPopupRow && activeCell?.col === checkCol;
          const bgStyle = isActiveCheck ? { background: '#e6f7ff', borderRadius: 4 } : {};

          if (item.type === 'standard') {
            const check = item.check as CheckTypeInfo;
            const options = checkState?.checkOptions.get(check.checkId) || [];
            // 所有标准辅助核算共享同一个 CheckItem
            const checkItem = hasStandardCheckItem ? checkItems[existingStandardCheckItemIndex] : undefined;
            const currentValue = checkItem?.checkValues?.[check.checkId];
            const checkItemIndex = hasStandardCheckItem ? existingStandardCheckItemIndex : -1;

            return (
              <div key={`chk-${check.checkId}`} style={{ ...rowStyle, ...bgStyle, padding: '2px 4px' }}>
                <Text type="secondary" style={labelStyle}>{check.checkName}</Text>
                <div style={inputStyle}>
                  {hasStandardCheckItem ? (
                    <Select
                      ref={(el: any) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                      size="small"
                      showSearch
                      style={{ width: '100%' }}
                      value={currentValue}
                      open={openCheckDropdowns[`${activeCheckPopupRow}-${checkCol}`]}
                      onDropdownVisibleChange={(visible) => {
                        setOpenCheckDropdowns(prev => ({ ...prev, [`${activeCheckPopupRow}-${checkCol}`]: visible }));
                      }}
                      onChange={(val) => {
                        if (checkItemIndex >= 0) {
                          const newValues = { ...checkItems[checkItemIndex].checkValues };
                          newValues[check.checkId] = val;
                          useVouchStore.getState().updateCheckItemInDetail(activeCheckPopupRow, checkItemIndex, { checkValues: newValues });
                        }
                        if (isLastCheck(globalIdx)) {
                          // Last check: close all dropdowns first, then navigate to amount
                          setOpenCheckDropdowns({});
                          setTimeout(() => navigateAfterCheck(activeCheckPopupRow), 50);
                        } else {
                          // Not last: close current dropdown, move to next check
                          setOpenCheckDropdowns({});
                          setTimeout(() => {
                            setActiveCell({ row: activeCheckPopupRow, col: `check-${globalIdx + 1}` });
                          }, 50);
                        }
                      }}
                      options={options.map((opt: CheckOption) => ({
                        value: opt.id,
                        label: `${opt.code} ${opt.name}`,
                      }))}
                      filterOption={(input, option) =>
                        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                      onKeyDown={(e) => handleCheckKeyDown(e, activeCheckPopupRow, globalIdx, allChecks.length)}
                    />
                  ) : (
                    <Select
                      ref={(el: any) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                      size="small"
                      showSearch
                      style={{ width: '100%' }}
                      placeholder={`选择${check.checkName}`}
                      value={undefined}
                      open={openCheckDropdowns[`${activeCheckPopupRow}-${checkCol}`]}
                      onDropdownVisibleChange={(visible) => {
                        setOpenCheckDropdowns(prev => ({ ...prev, [`${activeCheckPopupRow}-${checkCol}`]: visible }));
                      }}
                      onChange={(val: number) => {
                        const newCheckItem = {
                          acctCheckId: null,
                          line: 1,
                          checkItemType: 'standard' as const,
                          summary: details[activeCheckPopupRow]?.summary || null,
                          amtDebit: null,
                          amtCredit: null,
                          checkValues: { [check.checkId]: val } as Record<number, number>,
                          otherFzhsIdx: null,
                          infoFzhs1: null,
                          infoFzhs2: null,
                          infoFzhs3: null,
                          infoFzhs4: null,
                          infoFzhs5: null,
                          orderNo: null,
                          orderDate: null,
                          payTypeId: null,
                          cheqNo: null,
                          receiptNo: null,
                          occurDate: null,
                        };
                        useVouchStore.getState().addCheckItemToDetail(activeCheckPopupRow, newCheckItem);
                        if (isLastCheck(globalIdx)) {
                          setOpenCheckDropdowns({});
                          setTimeout(() => navigateAfterCheck(activeCheckPopupRow), 50);
                        } else {
                          setOpenCheckDropdowns({});
                          setTimeout(() => {
                            setActiveCell({ row: activeCheckPopupRow, col: `check-${globalIdx + 1}` });
                          }, 50);
                        }
                      }}
                      options={options.map((opt: CheckOption) => ({
                        value: opt.id,
                        label: `${opt.code} ${opt.name}`,
                      }))}
                      filterOption={(input, option) =>
                        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  )}
                </div>
              </div>
            );
          } else {
            const other = item.check as OtherFzhsInfo;
            const isAdded = existingOtherIdxs.has(other.otherFzhsIdx);
            const checkItemIndex = checkItems.findIndex(
              (ci) => ci.checkItemType === 'other' && ci.otherFzhsIdx === other.otherFzhsIdx
            );
            const checkItem = checkItemIndex >= 0 ? checkItems[checkItemIndex] : null;

            const getValue = () => {
              if (!checkItem) return '';
              switch (other.otherFzhsIdx) {
                case 1: return checkItem.infoFzhs1 || '';
                case 2: return checkItem.infoFzhs2 || '';
                case 3: return checkItem.infoFzhs3 || '';
                case 4: return checkItem.infoFzhs4 || '';
                case 5: return checkItem.infoFzhs5 || '';
                default: return '';
              }
            };

            const setValue = (val: string) => {
              if (checkItemIndex >= 0) {
                const update: any = {};
                switch (other.otherFzhsIdx) {
                  case 1: update.infoFzhs1 = val; break;
                  case 2: update.infoFzhs2 = val; break;
                  case 3: update.infoFzhs3 = val; break;
                  case 4: update.infoFzhs4 = val; break;
                  case 5: update.infoFzhs5 = val; break;
                }
                if (other.checkTypeName === '日期' && val) {
                  update.orderDate = val;
                  update.occurDate = val;
                }
                if (other.checkTypeName === '票据号' && val) {
                  update.cheqNo = val;
                  update.orderNo = val;
                }
                if (other.checkTypeName === '回单号' && val) {
                  update.receiptNo = val;
                }
                useVouchStore.getState().updateCheckItemInDetail(activeCheckPopupRow, checkItemIndex, update);
              }
            };

            const displayName = other.displayName || other.checkTypeName || `其他${other.otherFzhsIdx}`;

            return (
              <div key={`other-${other.otherFzhsIdx}`} style={{ ...rowStyle, ...bgStyle, padding: '2px 4px' }}>
                <Text type="secondary" style={labelStyle}>{displayName}</Text>
                <div style={inputStyle}>
                  {isAdded ? (
                    other.inputType === '4' ? (
                      <Select
                        ref={(el: any) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                        size="small"
                        showSearch
                        style={{ width: '100%' }}
                        value={getValue() || undefined}
                        open={openCheckDropdowns[`${activeCheckPopupRow}-${checkCol}`]}
                        onDropdownVisibleChange={(visible) => {
                          setOpenCheckDropdowns(prev => ({ ...prev, [`${activeCheckPopupRow}-${checkCol}`]: visible }));
                        }}
                        onChange={(val) => {
                          setValue(val as string);
                          if (isLastCheck(globalIdx)) {
                            setOpenCheckDropdowns({});
                            setTimeout(() => navigateAfterCheck(activeCheckPopupRow), 100);
                          } else {
                            setOpenCheckDropdowns({});
                            setTimeout(() => {
                              setActiveCell({ row: activeCheckPopupRow, col: `check-${globalIdx + 1}` });
                            }, 50);
                          }
                        }}
                        options={(checkState?.dictOptions.get(other.otherFzhsIdx) || []).map((opt: CheckOption) => ({
                          value: opt.code || String(opt.id),
                          label: opt.name,
                        }))}
                        filterOption={(input, option) =>
                          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        allowClear
                        onKeyDown={(e) => handleCheckKeyDown(e, activeCheckPopupRow, globalIdx, allChecks.length)}
                      />
                    ) : (
                      <Input
                        ref={(el: InputRef | null) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                        size="small"
                        style={{ width: '100%' }}
                        value={getValue()}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => handleCheckKeyDown(e, activeCheckPopupRow, globalIdx, allChecks.length)}
                      />
                    )
                  ) : (
                    other.inputType === '4' ? (
                      <Select
                        ref={(el: any) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                        size="small"
                        showSearch
                        style={{ width: '100%' }}
                        placeholder={displayName}
                        value={undefined}
                        open={openCheckDropdowns[`${activeCheckPopupRow}-${checkCol}`]}
                        onDropdownVisibleChange={(visible) => {
                          setOpenCheckDropdowns(prev => ({ ...prev, [`${activeCheckPopupRow}-${checkCol}`]: visible }));
                        }}
                        onChange={(val: string) => {
                          const newCheckItem = {
                            acctCheckId: null,
                            line: 2 + (other.otherFzhsIdx - 1),
                            checkItemType: 'other' as const,
                            summary: details[activeCheckPopupRow]?.summary || null,
                            amtDebit: null,
                            amtCredit: null,
                            checkValues: {},
                            otherFzhsIdx: other.otherFzhsIdx,
                            infoFzhs1: null,
                            infoFzhs2: null,
                            infoFzhs3: null,
                            infoFzhs4: null,
                            infoFzhs5: null,
                            orderNo: null,
                            orderDate: null,
                            payTypeId: null,
                            cheqNo: null,
                            receiptNo: null,
                            occurDate: null,
                          };
                          useVouchStore.getState().addCheckItemToDetail(activeCheckPopupRow, newCheckItem);
                          setTimeout(() => setValue(val), 100);
                          if (isLastCheck(globalIdx)) {
                            setOpenCheckDropdowns({});
                            setTimeout(() => navigateAfterCheck(activeCheckPopupRow), 150);
                          } else {
                            setOpenCheckDropdowns({});
                            setTimeout(() => {
                              setActiveCell({ row: activeCheckPopupRow, col: `check-${globalIdx + 1}` });
                            }, 50);
                          }
                        }}
                        options={(checkState?.dictOptions.get(other.otherFzhsIdx) || []).map((opt: CheckOption) => ({
                          value: opt.code || String(opt.id),
                          label: opt.name,
                        }))}
                        filterOption={(input, option) =>
                          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    ) : (
                      <Input
                        ref={(el: InputRef | null) => { inputRefs.current[`${activeCheckPopupRow}-${checkCol}`] = el; } }
                        size="small"
                        style={{ width: '100%' }}
                        placeholder={displayName}
                        value=""
                        onChange={(e) => {
                          const newCheckItem = {
                            acctCheckId: null,
                            line: 2 + (other.otherFzhsIdx - 1),
                            checkItemType: 'other' as const,
                            summary: details[activeCheckPopupRow]?.summary || null,
                            amtDebit: null,
                            amtCredit: null,
                            checkValues: {},
                            otherFzhsIdx: other.otherFzhsIdx,
                            infoFzhs1: null,
                            infoFzhs2: null,
                            infoFzhs3: null,
                            infoFzhs4: null,
                            infoFzhs5: null,
                            orderNo: null,
                            orderDate: null,
                            payTypeId: null,
                            cheqNo: null,
                            receiptNo: null,
                            occurDate: null,
                          };
                          useVouchStore.getState().addCheckItemToDetail(activeCheckPopupRow, newCheckItem);
                          setTimeout(() => setValue(e.target.value), 100);
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Determine scroll behavior: only show vertical scroll when rows > MAX_VISIBLE_ROWS
  // Always set x (even '100%') to keep table-layout: fixed so column widths don't change in edit mode
  const showScroll = details.length > MAX_VISIBLE_ROWS;
  const scrollConfig = {
    x: '100%',
    y: showScroll ? ROW_HEIGHT_PX * MAX_VISIBLE_ROWS + 2 : undefined,
  };

  return (
    <div ref={wrapperRef} style={{ minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      <div ref={tableRef}>
      <style>{`
        .voucher-table .ant-table {
          table-layout: fixed !important;
        }
        .voucher-table .ant-table-tbody > tr {
          transition: background-color 0.15s;
        }
        .voucher-table .ant-table-tbody > tr.voucher-row-hover {
          background-color: #f0f5ff !important;
        }
        .voucher-table .ant-table-tbody > tr.voucher-row-selected {
          background-color: #e6f7ff !important;
        }
        /* 财务科目(is_budg=0) — 浅绿色，同时设置 tr 和 td 以覆盖 Ant Design 的 cell 级背景 */
        .voucher-table .ant-table-tbody > tr.voucher-row-fin,
        .voucher-table .ant-table-tbody > tr.voucher-row-fin > td {
          background-color: #f6ffed !important;
        }
        /* 预算科目(is_budg=1) — 浅橙色，同时设置 tr 和 td */
        .voucher-table .ant-table-tbody > tr.voucher-row-budg,
        .voucher-table .ant-table-tbody > tr.voucher-row-budg > td {
          background-color: #fff7e6 !important;
        }
        /* 财务/预算行 hover — 叠加 brightness 滤镜模拟 hover 效果 */
        .voucher-table .ant-table-tbody > tr.voucher-row-fin.voucher-row-hover,
        .voucher-table .ant-table-tbody > tr.voucher-row-budg.voucher-row-hover {
          filter: brightness(0.96);
        }
        /* 财务/预算行 selected — 叠加 brightness 模拟选中效果 */
        .voucher-table .ant-table-tbody > tr.voucher-row-fin.voucher-row-selected,
        .voucher-table .ant-table-tbody > tr.voucher-row-budg.voucher-row-selected {
          filter: brightness(0.93);
        }
        .voucher-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          height: ${ROW_HEIGHT_PX}px;
        }
        .voucher-table .ant-table-thead > tr > th {
          padding: 4px 8px !important;
          font-weight: 500;
          background: #fafafa;
        }
        .voucher-table .ant-table-tbody .ant-input,
        .voucher-table .ant-table-tbody .ant-input-number,
        .voucher-table .ant-table-tbody .ant-select,
        .voucher-table .ant-table-tbody .ant-select-selector {
          height: 100% !important;
          min-height: ${ROW_HEIGHT_PX - 8}px;
        }
        .voucher-table .ant-table-tbody .ant-input-number input {
          height: 100%;
        }
        .voucher-table .ant-table-tbody > tr > td .ant-input-number {
          width: 100% !important;
        }
        .voucher-table .ant-table-tbody > tr > td .ant-select {
          width: 100% !important;
        }
        .voucher-table .edit-col {
          padding: 1px 0 !important;
          vertical-align: middle;
        }
        .voucher-table .ant-table-tbody .ant-select-single .ant-select-selector {
          padding: 0 4px;
        }
        .voucher-table .ant-table-summary > tr > td {
          padding: 4px 8px !important;
          border-right: 1px solid #f0f0f0;
        }
        /* Scrollbar styling for the table body */
        .voucher-table .ant-table-body::-webkit-scrollbar {
          width: 6px;
        }
        .voucher-table .ant-table-body::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 4px;
        }
        /* Row number column center alignment */
        .voucher-table .row-num-col {
          text-align: center !important;
        }
        /* Ensure sticky header has solid background */
        .voucher-table .ant-table-thead {
          position: sticky !important;
          top: 0 !important;
          z-index: 3 !important;
        }
        .voucher-table .ant-table-thead > tr > th {
          background: #fafafa !important;
        }
      `}</style>
      <Table
        className="voucher-table"
        dataSource={details.map((d, i) => ({ ...d, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        showHeader={true}
        sticky={true}
        scroll={scrollConfig}
        onRow={(_, index) => {
          const checkState = detailCheckStates.get(index!);
          const isBudg = checkState?.subjConfig?.isBudg;
          const budgClass = isBudg === '1' ? 'voucher-row-budg' : (isBudg === '0' ? 'voucher-row-fin' : '');
          return {
            onMouseEnter: () => setHoverRow(index!),
            onMouseLeave: () => setHoverRow(null),
            onClick: () => handleRowClick(index!),
            className: [
              hoverRow === index ? 'voucher-row-hover' : '',
              selectedRow === index ? 'voucher-row-selected' : '',
              budgClass,
            ].filter(Boolean).join(' '),
          };
        }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong style={{ fontSize: 13 }}>合计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2}>
                <span
                  style={{
                    color: isBalanced ? undefined : '#ff4d4f',
                    fontSize: 12,
                  }}
                >
                  {isBalanced
                    ? numberToChinese(totalDebit)
                    : numberToChinese(Math.abs(totalDebit - totalCredit))
                  }
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <div style={{ textAlign: 'right' }}>
                  <Text>{new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDebit)}</Text>
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <div style={{ textAlign: 'right' }}>
                  <Text>{new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalCredit)}</Text>
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {renderFloatingCheckPopup()}
    </div>
    </div>
  );
};

export default DetailTable;