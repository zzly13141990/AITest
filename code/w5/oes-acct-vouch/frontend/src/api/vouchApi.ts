import axios from 'axios';
import type {
  ApiResponse,
  VouchLoadResponse,
  VouchSaveRequest,
  SaveVouchResult,
  SubjCheckConfig,
  CheckOption,
  NavigationResult,
  SubjSearchResult,
  VouchType,
  CascadeCheckRequest,
  CascadeCheckResponse,
  DraftSaveRequest,
  DraftItem,
} from '../types/vouch';

const http = axios.create({
  baseURL: '/oes-acct-vouch',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const vouchApi = {
  /** Load voucher (create or edit mode) */
  loadVouch(params: {
    account: string;
    vouchId?: string;
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
    acctMonth?: string;
    isWatch?: string;
    isAudit?: string;
  }): Promise<ApiResponse<VouchLoadResponse>> {
    return http.get('', { params });
  },

  /** Save voucher */
  saveVouch(request: VouchSaveRequest, account = 'admin'): Promise<ApiResponse<SaveVouchResult>> {
    return http.post('/save', request, { params: { account } });
  },

  /** Get subject check configuration */
  getSubjChecks(params: {
    acctSubjCode: string;
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
  }): Promise<ApiResponse<SubjCheckConfig>> {
    return http.get('/subj/checks', { params });
  },

  /** Search subjects by keyword */
  searchSubjects(params: {
    keyword: string;
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
    limit?: number;
  }): Promise<ApiResponse<SubjSearchResult[]>> {
    return http.get('/subj/search', { params });
  },

  /** Get check options from archive table */
  getCheckOptions(params: {
    checkId: number;
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
  }): Promise<ApiResponse<CheckOption[]>> {
    return http.get('/check/options', { params });
  },

  /** Navigate to prev/next voucher */
  navigate(params: {
    vouchId?: number;
    direction: string;
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
    acctMonth?: string;
    vouchNo?: number;
  }): Promise<ApiResponse<NavigationResult>> {
    return http.get('/navigation', { params });
  },

  /** Cascade check query (PRD §7.7) */
  cascadeCheck(request: CascadeCheckRequest): Promise<ApiResponse<CascadeCheckResponse>> {
    return http.post('/cascade-check', request);
  },

  /** Get all voucher types */
  getVouchTypes(): Promise<ApiResponse<VouchType[]>> {
    return http.get('/types');
  },

  /** Get top N subjects ordered by code */
  getTopSubjects(params: {
    compCode?: string;
    copyCode?: string;
    acctYear?: string;
    limit?: number;
  }): Promise<ApiResponse<SubjSearchResult[]>> {
    return http.get('/subj/top', { params });
  },

  /** Log frontend operation (print, etc.) */
  logOperation(operation: string, module: string, detail?: string): Promise<ApiResponse<void>> {
    return http.post('/log/operation', { operation, module, detail });
  },

  /** 保存草稿 */
  saveDraft(request: DraftSaveRequest, account = 'admin'): Promise<ApiResponse<SaveVouchResult>> {
    return http.post('/draft/save', request, { params: { account } });
  },

  /** 更新草稿 */
  updateDraft(request: DraftSaveRequest, account = 'admin'): Promise<ApiResponse<SaveVouchResult>> {
    return http.put('/draft/update', request, { params: { account } });
  },

  /** 获取草稿列表 */
  getDraftList(): Promise<ApiResponse<DraftItem[]>> {
    return http.get('/draft/list');
  },

  /** 加载单个草稿 */
  loadDraft(draftId: number): Promise<ApiResponse<VouchLoadResponse>> {
    return http.get('/draft/load', { params: { draftId } });
  },

  /** 删除草稿 */

  /** 审核凭证 */
  auditVouch(vouchId: number, account: string): Promise<ApiResponse<void>> {
    return http.post('/audit', null, { params: { vouchId, account } });
  },

  /** 销审凭证 */
  unauditVouch(vouchId: number, account: string): Promise<ApiResponse<void>> {
    return http.post('/unaudit', null, { params: { vouchId, account } });
  },
  deleteDraft(draftId: number): Promise<ApiResponse<void>> {
    return http.delete('/draft/delete', { params: { draftId } });
  },
};