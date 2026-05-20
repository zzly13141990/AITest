import { create } from 'zustand';
import { message } from 'antd';
import type {
  VouchMain,
  VouchDetail,
  CheckItem,
  OperatorInfo,
  SubjCheckConfig,
  CheckOption,
  CheckTypeInfo,
  OtherFzhsInfo,
  SubjSearchResult,
  VouchType,
  DraftItem,
  DraftMain,
  DraftDetail,
  DraftCheckItem,
  DraftSaveRequest,
} from '../types/vouch';
import { vouchApi } from '../api/vouchApi';

const MIN_ROWS = 6;

function createBlankDetail(row: number): VouchDetail {
  return {
    vouchDetailId: null,
    vouchPage: 1,
    vouchRow: row,
    summary: '',
    acctSubjCode: null,
    amtDebit: null,
    amtCredit: null,
    checkItems: [],
  };
}

export function ensureMinRows(details: VouchDetail[]): VouchDetail[] {
  if (details.length < MIN_ROWS) {
    const padded = [...details];
    for (let i = padded.length; i < MIN_ROWS; i++) {
      padded.push(createBlankDetail(i + 1));
    }
    return padded;
  }
  return details;
}

interface DetailCheckState {
  subjConfig: SubjCheckConfig | null;
  checkOptions: Map<number, CheckOption[]>;
  dictOptions: Map<number, CheckOption[]>;
}

interface VouchState {
  mode: 'create' | 'edit' | 'view' | 'audited' | 'posted' | 'pending_audit';
  compCode: string;
  copyCode: string;
  acctYear: string;
  acctMonth: string;
  account: string;
  operatorInfo: OperatorInfo | null;
  vouchForm: VouchMain | null;
  details: VouchDetail[];
  subjectSearchResults: SubjSearchResult[];
  subjectSearching: boolean;
  detailCheckStates: Map<number, DetailCheckState>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasPrev: boolean;
  hasNext: boolean;
  hoverRow: number | null;
  expandedCheckRows: Set<number>;
  activeCell: { row: number; col: string } | null;
  selectedRow: number | null;
  vouchTypes: VouchType[];

  initParams: (params: { compCode: string; copyCode: string; acctYear: string; acctMonth: string; account: string; vouchId?: string; isWatch?: string; isAudit?: string }) => void;
  loadVouch: (vouchId?: string, isWatch?: string, isAudit?: string) => Promise<void>;
  saveVouch: () => Promise<{ vouchId: number; vouchNo: number }>;
  updateVouchForm: (updates: Partial<VouchMain>) => void;
  addDetail: () => void;
  addDetailBelow: (index: number) => void;
  removeDetail: (index: number) => void;
  updateDetail: (index: number, updates: Partial<VouchDetail>) => void;
  searchSubjects: (keyword: string) => Promise<void>;
  loadSubjChecks: (detailIndex: number) => Promise<void>;
  loadCheckOptions: (detailIndex: number, checkId: number) => Promise<CheckOption[]>;
  addCheckItemToDetail: (detailIndex: number, checkItem: CheckItem) => void;
  removeCheckItemFromDetail: (detailIndex: number, checkItemIndex: number) => void;
  updateCheckItemInDetail: (detailIndex: number, checkItemIndex: number, updates: Partial<CheckItem>) => void;
  navigateVouch: (direction: 'prev' | 'next') => Promise<void>;
  clearError: () => void;
  reset: () => void;
  setHoverRow: (row: number | null) => void;
  toggleExpandedCheckRow: (row: number) => void;
  setActiveCell: (cell: { row: number; col: string } | null) => void;
  setSelectedRow: (row: number | null) => void;
  loadVouchTypes: () => Promise<void>;
  loadTopSubjects: (limit?: number) => Promise<void>;
  updateDetailCheckItems: (detailIndex: number, checkItems: CheckItem[]) => void;
  draftList: DraftItem[];
  draftListLoading: boolean;
  loadDraftList: () => Promise<DraftItem[]>;
  deleteDraft: (draftId: number) => Promise<void>;
  readonly: boolean;
  vouchStatusText: string;
  auditVouch: () => Promise<void>;
  unauditVouch: () => Promise<void>;
}

/** Helper: extract info_fzhs value from a CheckItem by index (1~5) */
function getInfoFzhsValueFromCheckItem(ci: CheckItem, idx: number): string | null {
  switch (idx) {
    case 1: return ci.infoFzhs1 || null;
    case 2: return ci.infoFzhs2 || null;
    case 3: return ci.infoFzhs3 || null;
    case 4: return ci.infoFzhs4 || null;
    case 5: return ci.infoFzhs5 || null;
    default: return null;
  }
}


/** 根据状态码和凭证数据计算状态显示文本 */
function computeVouchStatusText(mode: string, vouch: VouchMain | null): string {
  if (mode === 'create') return '制单';
  if (mode === 'posted') return '已记账';
  if (mode === 'audited') return '已审核';
  if (mode === 'pending_audit') return '待审';
  if (mode === 'view') return '查看';
  if (mode === 'edit') return '编辑';
  return vouch?.auditor ? '已审核' : '制单';
}

export const useVouchStore = create<VouchState>((set, get) => ({
  mode: 'create',
  compCode: '',
  copyCode: '',
  acctYear: '',
  acctMonth: '',
  account: '',
  operatorInfo: null,
  vouchForm: null,
  details: [],
  subjectSearchResults: [],
  subjectSearching: false,
  detailCheckStates: new Map(),
  loading: false,
  saving: false,
  error: null,
  hasPrev: false,
  hasNext: false,
  hoverRow: null,
  expandedCheckRows: new Set(),
  activeCell: null,
  selectedRow: null,
  vouchTypes: [],

  draftList: [],
  draftListLoading: false,
  readonly: false,
  vouchStatusText: '',

  initParams: (params) => {
    set({
      compCode: params.compCode,
      copyCode: params.copyCode,
      acctYear: params.acctYear,
      acctMonth: params.acctMonth,
      account: params.account,
    });
    if (params.vouchId) {
      set({ loading: true });
      get().loadVouch(params.vouchId, params.isWatch, params.isAudit);
    }
  },

  loadVouch: async (vouchId?: string, isWatch?: string, isAudit?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const res = await vouchApi.loadVouch({
        account: state.account,
        vouchId,
        compCode: state.compCode,
        copyCode: state.copyCode,
        acctYear: state.acctYear,
        acctMonth: state.acctMonth,
        isWatch,
        isAudit,
      });
      const paddedDetails = ensureMinRows(res.data.details);
      const statusText = computeVouchStatusText(res.data.mode, res.data.vouch);
      set({
        mode: res.data.mode,
        vouchForm: res.data.vouch,
        details: paddedDetails,
        operatorInfo: res.data.operatorInfo,
        detailCheckStates: new Map(),
        loading: false,
        readonly: res.data.readonly,
        vouchStatusText: statusText,
      });

      for (let i = 0; i < paddedDetails.length; i++) {
        if (paddedDetails[i].acctSubjCode) {
          get().loadSubjChecks(i);
        }
      }
    } catch (err: any) {
      set({ loading: false, error: err.message || '加载凭证失败' });
    }
  },

  saveVouch: async () => {
    set({ saving: true, error: null });
    try {
      const state = get();
      const nonBlankDetails = state.details.filter(
        (d) => d.acctSubjCode || d.summary || d.amtDebit != null || d.amtCredit != null
      );

      if (nonBlankDetails.length === 0) {
        throw new Error('请至少录入一条分录');
      }

      // Rule 1: 已经录了金额，没有录科目或摘要的分录
      for (let i = 0; i < nonBlankDetails.length; i++) {
        const d = nonBlankDetails[i];
        const hasAmount = (d.amtDebit != null && d.amtDebit > 0) || (d.amtCredit != null && d.amtCredit > 0);
        if (hasAmount) {
          if (!d.acctSubjCode) {
            throw new Error(`第${i + 1}行分录已录入金额，请录入科目`);
          }
          if (!d.summary || !d.summary.trim()) {
            throw new Error(`第${i + 1}行分录已录入金额，请录入摘要`);
          }
        }
      }

      // Rule 2: 经录了科目，没有录辅助核算的分录
      for (let i = 0; i < nonBlankDetails.length; i++) {
        const d = nonBlankDetails[i];
        if (!d.acctSubjCode) continue;

        const checkState = state.detailCheckStates.get(i);
        const config = checkState?.subjConfig;
        if (!config) continue;

        // Standard checks (checktype1-8)：科目设置了辅助核算且必填
        if (config.isCheck === '1' && config.checks.length > 0) {
          const hasStandardCheckItem = (d.checkItems || []).some(ci => ci.checkItemType === 'standard');
          if (!hasStandardCheckItem) {
            throw new Error(`第${i + 1}行分录科目${d.acctSubjCode}需要录入辅助核算`);
          }
          // Check if all standard checks have values
          for (const check of config.checks) {
            const hasValue = (d.checkItems || []).some(ci => {
              if (ci.checkItemType !== 'standard') return false;
              return ci.checkValues && ci.checkValues[check.checkId] != null;
            });
            if (!hasValue) {
              throw new Error(`第${i + 1}行分录辅助核算(${check.checkName})为必填项`);
            }
          }
        }

        // Other fzhs checks：根据acct_subj_other_fz_setting表判断
        const requiredOtherFzhs = config.otherFzhsChecks.filter(o => o.isRequire === 1);
        for (const req of requiredOtherFzhs) {
          const hasOtherItem = (d.checkItems || []).some(ci => {
            if (ci.checkItemType !== 'other' || ci.otherFzhsIdx !== req.otherFzhsIdx) return false;
            const val = getInfoFzhsValueFromCheckItem(ci, req.otherFzhsIdx);
            return val != null && val.trim() !== '';
          });
          if (!hasOtherItem) {
            throw new Error(`第${i + 1}行分录其他辅助核算(${req.displayName || req.checkTypeName})为必填项`);
          }
        }
      }

      // Rule 2.5: 分录金额与对应分录行的辅助核算金额是否一致
      for (let i = 0; i < nonBlankDetails.length; i++) {
        const d = nonBlankDetails[i];
        if (!d.checkItems || d.checkItems.length === 0) continue;

        const totalCheckDebit = d.checkItems.reduce((sum, ci) => sum + (ci.amtDebit || 0), 0);
        const totalCheckCredit = d.checkItems.reduce((sum, ci) => sum + (ci.amtCredit || 0), 0);

        if (totalCheckDebit > 0 || totalCheckCredit > 0) {
          const detailDebit = d.amtDebit || 0;
          const detailCredit = d.amtCredit || 0;

          if (Math.abs(totalCheckDebit - detailDebit) > 0.01 || Math.abs(totalCheckCredit - detailCredit) > 0.01) {
            const detailAmt = detailDebit > 0 ? detailDebit : detailCredit;
            const checkAmt = totalCheckDebit > 0 ? totalCheckDebit : totalCheckCredit;
            throw new Error(
              `第${i + 1}行分录：辅助核算金额与分录金额不一致` +
              `（分录：${detailAmt.toFixed(2)} ，辅助核算：${checkAmt.toFixed(2)} ）`
            );
          }
        }
      }

      // Rule 3: 按财务/预算分类校验借贷平衡
      let finDebit = 0, finCredit = 0, budgDebit = 0, budgCredit = 0;
      for (let i = 0; i < state.details.length; i++) {
        const d = state.details[i];
        if (!d.acctSubjCode) continue;
        const isBudg = state.detailCheckStates.get(i)?.subjConfig?.isBudg;
        if (isBudg === '0') {
          finDebit += d.amtDebit || 0;
          finCredit += d.amtCredit || 0;
        } else if (isBudg === '1') {
          budgDebit += d.amtDebit || 0;
          budgCredit += d.amtCredit || 0;
        }
      }
      if (Math.abs(finDebit - finCredit) > 0.01) {
        throw new Error(`财务分录借贷不平衡: 借方合计=${finDebit.toFixed(2)}, 贷方合计=${finCredit.toFixed(2)}, 差额=${Math.abs(finDebit - finCredit).toFixed(2)}`);
      }
      if (Math.abs(budgDebit - budgCredit) > 0.01) {
        throw new Error(`预算分录借贷不平衡: 借方合计=${budgDebit.toFixed(2)}, 贷方合计=${budgCredit.toFixed(2)}, 差额=${Math.abs(budgDebit - budgCredit).toFixed(2)}`);
      }

      const res = await vouchApi.saveVouch(
        {
          vouch: state.vouchForm!,
          details: nonBlankDetails,
        },
        state.account
      );
      set({
        saving: false,
        vouchForm: { ...state.vouchForm!, vouchId: res.data.vouchId, vouchNo: res.data.vouchNo } as VouchMain,
      });
      return { vouchId: res.data.vouchId, vouchNo: res.data.vouchNo };
    } catch (err: any) {
      set({ saving: false, error: err.message || '保存凭证失败' });
      throw err;
    }
  },

  updateVouchForm: (updates) => {
    const state = get();
    if (state.vouchForm) {
      set({ vouchForm: { ...state.vouchForm, ...updates } });
    }
  },

  addDetail: () => {
    const state = get();
    const newIndex = state.details.length;
    const newDetail = createBlankDetail(newIndex + 1);
    const newDetails = [...state.details, newDetail];
    const newCheckStates = new Map(state.detailCheckStates);
    newCheckStates.set(newIndex, {
      subjConfig: null,
      checkOptions: new Map(),
      dictOptions: new Map(),
    });
    set({ details: newDetails, detailCheckStates: newCheckStates });
  },

  addDetailBelow: (index: number) => {
    const state = get();
    const newDetail = createBlankDetail(0);
    const newDetails = [...state.details];
    newDetails.splice(index + 1, 0, newDetail);

    const newCheckStates = new Map();
    let inserted = false;
    for (let i = 0; i < state.details.length; i++) {
      newCheckStates.set(i, state.detailCheckStates.get(i) || {
        subjConfig: null,
        checkOptions: new Map(),
        dictOptions: new Map(),
      });
      if (i === index) {
        newCheckStates.set(index + 1, {
          subjConfig: null,
          checkOptions: new Map(),
          dictOptions: new Map(),
        });
        inserted = true;
      }
    }
    if (!inserted) {
      newCheckStates.set(state.details.length, {
        subjConfig: null,
        checkOptions: new Map(),
        dictOptions: new Map(),
      });
    }

    const finalDetails = newDetails.map((d, i) => ({ ...d, vouchRow: i + 1 }));
    set({ details: finalDetails, detailCheckStates: newCheckStates });
  },

  removeDetail: (index) => {
    const state = get();
    const newDetails = state.details.filter((_, i) => i !== index);
    const finalDetails = ensureMinRows(newDetails).map((d, i) => ({ ...d, vouchRow: i + 1 }));
    const newCheckStates = new Map(state.detailCheckStates);
    newCheckStates.delete(index);
    set({ details: finalDetails, detailCheckStates: newCheckStates });
  },

  updateDetail: (index, updates) => {
    const state = get();
    const newDetails = [...state.details];
    newDetails[index] = { ...newDetails[index], ...updates };
    set({ details: newDetails });
  },

  searchSubjects: async (keyword) => {
    if (!keyword || keyword.length < 1) {
      set({ subjectSearchResults: [], subjectSearching: false });
      return;
    }
    set({ subjectSearching: true });
    try {
      const state = get();
      const res = await vouchApi.searchSubjects({
        keyword,
        compCode: state.compCode,
        copyCode: state.copyCode,
        acctYear: state.acctYear,
      });
      set({ subjectSearchResults: res.data, subjectSearching: false });
    } catch {
      set({ subjectSearchResults: [], subjectSearching: false });
    }
  },

  loadSubjChecks: async (detailIndex) => {
    const state = get();
    const detail = state.details[detailIndex];
    if (!detail?.acctSubjCode) return;

    try {
      const res = await vouchApi.getSubjChecks({
        acctSubjCode: detail.acctSubjCode,
        compCode: state.compCode,
        copyCode: state.copyCode,
        acctYear: state.acctYear,
      });
      const config = res.data;

      // 使用 get() 获取最新 state 以避免并发时覆盖其他行的配置
      const currentState = get();
      const newCheckStates = new Map(currentState.detailCheckStates);
      const existingState = newCheckStates.get(detailIndex) || {
        subjConfig: null,
        checkOptions: new Map(),
        dictOptions: new Map(),
      };
      existingState.subjConfig = config;
      newCheckStates.set(detailIndex, existingState);

      // Preserve existing checkItems — don't clear them
      set({ detailCheckStates: newCheckStates });

      // Load check options and wait for all to complete
      const optionPromises = config.checks.map(check =>
        get().loadCheckOptions(detailIndex, check.checkId)
      );
      await Promise.all(optionPromises);

      const totalChecks = config.checks.length + config.otherFzhsChecks.length;
      if (totalChecks > 0) {
        const currentState = get();
        const newExpanded = new Set(currentState.expandedCheckRows);
        newExpanded.add(detailIndex);
        set({ expandedCheckRows: newExpanded });
      }
    } catch (err: any) {
      console.error('Failed to load subject checks:', err);
    }
  },

  loadCheckOptions: async (detailIndex, checkId) => {
    const state = get();
    try {
      const res = await vouchApi.getCheckOptions({
        checkId,
        compCode: state.compCode,
        copyCode: state.copyCode,
        acctYear: state.acctYear,
      });
      // 使用 get() 获取最新 state 以避免并发时覆盖其他行的配置
      const currentState = get();
      const newCheckStates = new Map(currentState.detailCheckStates);
      const existingState = newCheckStates.get(detailIndex) || {
        subjConfig: null,
        checkOptions: new Map(),
        dictOptions: new Map(),
      };
      existingState.checkOptions.set(checkId, res.data);
      newCheckStates.set(detailIndex, existingState);
      set({ detailCheckStates: newCheckStates });
      return res.data;
    } catch {
      return [];
    }
  },

  addCheckItemToDetail: (detailIndex, checkItem) => {
    const state = get();
    const newDetails = [...state.details];
    const detail = newDetails[detailIndex];
    newDetails[detailIndex] = {
      ...detail,
      checkItems: [...(detail.checkItems || []), checkItem],
    };
    set({ details: newDetails });
  },

  removeCheckItemFromDetail: (detailIndex, checkItemIndex) => {
    const state = get();
    const newDetails = [...state.details];
    const detail = newDetails[detailIndex];
    newDetails[detailIndex] = {
      ...detail,
      checkItems: detail.checkItems.filter((_, i) => i !== checkItemIndex),
    };
    set({ details: newDetails });
  },

  updateCheckItemInDetail: (detailIndex, checkItemIndex, updates) => {
    const state = get();
    const newDetails = [...state.details];
    const detail = newDetails[detailIndex];
    const newCheckItems = [...(detail.checkItems || [])];
    newCheckItems[checkItemIndex] = { ...newCheckItems[checkItemIndex], ...updates };
    newDetails[detailIndex] = { ...detail, checkItems: newCheckItems };
    set({ details: newDetails });
  },

  /** Replace all checkItems for a specific detail row (used by AuxAccountingModal) */
  updateDetailCheckItems: (detailIndex: number, checkItems: CheckItem[]) => {
    const state = get();
    const newDetails = [...state.details];
    newDetails[detailIndex] = { ...newDetails[detailIndex], checkItems };
    set({ details: newDetails });
  },

  navigateVouch: async (direction) => {
    const state = get();
    if (!state.vouchForm) return;
    try {
      const res = await vouchApi.navigate({
        vouchId: state.vouchForm.vouchId ?? undefined,
        direction,
        compCode: state.vouchForm.compCode,
        copyCode: state.vouchForm.copyCode,
        acctYear: state.vouchForm.acctYear,
        acctMonth: state.vouchForm.acctMonth,
        vouchNo: state.vouchForm.vouchNo ?? undefined,
      });
      if (res.data.vouchId) {
        await get().loadVouch(String(res.data.vouchId));
      }
      set({ hasPrev: res.data.hasPrev, hasNext: res.data.hasNext });
    } catch (err: any) {
      set({ error: err.message || '导航失败' });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => {
    const blankDetails = [];
    for (let i = 0; i < MIN_ROWS; i++) {
      blankDetails.push(createBlankDetail(i + 1));
    }
    const s = get();
    set({
      mode: 'create',
      vouchForm: null,
      details: blankDetails,
      operatorInfo: null,
      subjectSearchResults: [],
      subjectSearching: false,
      detailCheckStates: new Map(),
      loading: false,
      saving: false,
      error: null,
      hasPrev: false,
      hasNext: false,
      hoverRow: null,
      expandedCheckRows: new Set(),
      activeCell: null,
      selectedRow: null,
      vouchTypes: [],
      // preserve app params across reset
      compCode: s.compCode,
      copyCode: s.copyCode,
      acctYear: s.acctYear,
      acctMonth: s.acctMonth,
      account: s.account,
    });
  },

  setHoverRow: (row) => set({ hoverRow: row }),

  toggleExpandedCheckRow: (row) => {
    const state = get();
    const newExpanded = new Set(state.expandedCheckRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    set({ expandedCheckRows: newExpanded });
  },

  setActiveCell: (cell) => set({ activeCell: cell }),

  setSelectedRow: (row) => set({ selectedRow: row }),

  loadVouchTypes: async () => {
    try {
      const res = await vouchApi.getVouchTypes();
      set({ vouchTypes: res.data });
      console.log('[VouchStore] 凭证字加载成功:', res.data?.length, '条');
    } catch (err: any) {
      console.error('[VouchStore] 凭证字加载失败:', err?.message || err);
    }
  },

  loadTopSubjects: async (limit = 500) => {
    const state = get();
    set({ subjectSearching: true });
    try {
      const res = await vouchApi.getTopSubjects({
        compCode: state.compCode,
        copyCode: state.copyCode,
        acctYear: state.acctYear,
        limit,
      });
      set({ subjectSearchResults: res.data, subjectSearching: false });
    } catch (err: any) {
      console.error('[VouchStore] 科目列表加载失败:', err?.message || err);
      set({ subjectSearching: false });
    }
  },

  loadDraftList: async () => {
    const state = get();
    if (state.draftListLoading) return [];
    set({ draftListLoading: true });
    try {
      const res = await vouchApi.getDraftList();
      set({ draftList: res.data, draftListLoading: false });
      return res.data;
    } catch (err: any) {
      console.error('[VouchStore] 草稿列表加载失败:', err?.message || err);
      set({ draftListLoading: false });
      return [];
    }
  },

  deleteDraft: async (draftId: number) => {
    try {
      await vouchApi.deleteDraft(draftId);
      const state = get();
      set({
        draftList: state.draftList.filter(d => d.draftId !== draftId),
      });
    } catch (err: any) {
      console.error('[VouchStore] 草稿删除失败:', err?.message || err);
      throw err;
    }
  },

  auditVouch: async () => {
    const state = get();
    const vouchId = state.vouchForm?.vouchId;
    if (!vouchId) {
      set({ error: '没有可审核的凭证' });
      return;
    }
    try {
      await vouchApi.auditVouch(vouchId, state.account);
      message.success('审核成功');
      await get().loadVouch(String(vouchId));
    } catch (err: any) {
      set({ error: err?.message || '审核失败' });
    }
  },

  unauditVouch: async () => {
    const state = get();
    const vouchId = state.vouchForm?.vouchId;
    if (!vouchId) {
      set({ error: '没有可销审的凭证' });
      return;
    }
    try {
      await vouchApi.unauditVouch(vouchId, state.account);
      message.success('销审成功');
      await get().loadVouch(String(vouchId));
    } catch (err: any) {
      set({ error: err?.message || '销审失败' });
    }
  },

}));