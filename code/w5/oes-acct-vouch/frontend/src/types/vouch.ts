// OES Accounting Voucher Type Definitions

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface OperatorInfo {
  account: string;
  name: string;
  userId: string;
  empCode: string;
  empId: number | null;
  empName: string;
  deptId: number | null;
  deptCode: string;
  deptName: string;
  deptNameAll: string;
  category: string;
}

export interface VouchMain {
  vouchId: number | null;
  compCode: string;
  copyCode: string;
  acctYear: string;
  acctMonth: string;
  vouchNo: number | null;
  vouchDate: string;
  vouchBillNum: number;
  vouchTypeId: number;
  vouchSourceCode: string;
  accManager: string | null;
  operator: string | null;
  modifier: string | null;
  teller: string | null;
  typeAttr: number;
  summary: string | null;
  auditor: string | null;
  poster: string | null;
}

export interface CheckItem {
  acctCheckId: number | null;
  line: number | null;
  // PRD §7.5: 'standard' | 'other'
  checkItemType: string;
  summary: string | null;
  amtDebit: number | null;
  amtCredit: number | null;
  // PRD §4.6: key=check_id, value=selected archive id
  checkValues: Record<number, number>;
  // v2.1: other fzhs index (1~5), only used when checkItemType='other'
  otherFzhsIdx: number | null;
  infoFzhs1: string | null;
  infoFzhs2: string | null;
  infoFzhs3: string | null;
  infoFzhs4: string | null;
  infoFzhs5: string | null;
  orderNo: string | null;
  orderDate: string | null;
  payTypeId: number | null;
  cheqNo: string | null;
  receiptNo: string | null;
  occurDate: string | null;
}

export interface VouchDetail {
  vouchDetailId: number | null;
  vouchPage: number | null;
  vouchRow: number | null;
  summary: string | null;
  acctSubjCode: string | null;
  amtDebit: number | null;
  amtCredit: number | null;
  checkItems: CheckItem[];
}

export interface VouchSaveRequest {
  vouch: VouchMain;
  details: VouchDetail[];
  deletedDetailIds?: number[];
}

export interface SaveVouchResult {
  vouchId: number;
  vouchNo: number;
  message: string;
}

export interface VouchLoadResponse {
  mode: 'create' | 'edit' | 'view' | 'audited' | 'posted' | 'pending_audit';
  vouch: VouchMain;
  details: VouchDetail[];
  operatorInfo: OperatorInfo;
  readonly: boolean;
}

export interface CheckTypeInfo {
  checkId: number;
  checkName: string;
  tableId: string;
  checkIndex: number;
}

export interface OtherFzhsInfo {
  otherFzhsIdx: number;
  checkTypeName: string;
  inputType: string | null;
  dictType: string | null;
  dictName: string | null;
  isShow: number;
  isRequire: number;
  displayName: string | null;
}

export interface SubjCheckConfig {
  acctSubjCode: string;
  acctSubjName: string | null;
  acctSubjNameAll: string | null;
  isCheck: string;
  isBudg: string;
  checks: CheckTypeInfo[];
  otherFzhsChecks: OtherFzhsInfo[];
}

export interface CheckOption {
  id: number;
  code: string;
  name: string;
}

export interface NavigationResult {
  vouchId: number | null;
  vouchNo: number | null;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface SubjSearchResult {
  acctSubjId: number;
  acctSubjCode: string;
  acctSubjName: string;
  acctSubjNameAll: string;
  isLast: string;
}

export interface VouchType {
  vouchTypeId: number;
  vouchTypeCode: string;
  vouchTypeName: string;
  typeAttr: number;
}

// Draft (草稿) Types
export interface DraftItem {
  draftId: number;
  draftName: string;
  draftCreateTime: string;
  draftCreator: string;
}

export interface DraftMain {
  draftId: number | null;
  draftName: string;
  compCode: string;
  copyCode: string;
  acctYear: string;
  acctMonth: string;
  vouchNo: number | null;
  vouchDate: string;
  vouchBillNum: number;
  vouchTypeId: number;
  vouchSourceCode: string;
  accManager: string | null;
  operator: string | null;
  modifier: string | null;
  teller: string | null;
  typeAttr: number;
  summary: string | null;
  auditor: string | null;
  poster: string | null;
}

export interface DraftDetail {
  vouchDetailId: number | null;
  vouchPage: number | null;
  vouchRow: number | null;
  summary: string | null;
  acctSubjCode: string | null;
  amtDebit: number | null;
  amtCredit: number | null;
  checkItems: DraftCheckItem[];
}

export interface DraftCheckItem {
  acctCheckId: number | null;
  line: number | null;
  checkItemType: string;
  summary: string | null;
  amtDebit: number | null;
  amtCredit: number | null;
  checkValues: Record<number, number>;
  otherFzhsIdx: number | null;
  infoFzhs1: string | null;
  infoFzhs2: string | null;
  infoFzhs3: string | null;
  infoFzhs4: string | null;
  infoFzhs5: string | null;
  orderNo: string | null;
  orderDate: string | null;
  payTypeId: number | null;
  cheqNo: string | null;
  receiptNo: string | null;
  occurDate: string | null;
}

export interface DraftSaveRequest {
  draft: DraftMain;
  details: DraftDetail[];
}

// PRD §7.7: Cascade check request/response
export interface CascadeCheckRequest {
  mainTableId: string;
  mainFieldCode: string;
  mainValueId: number;
  compCode: string;
  copyCode: string;
  acctYear: string;
}

export interface CascadeValueResult {
  attrId: number;
  attrTableId: string;
  attrFieldCode: string;
  attrShowName: string;
  targetOtherFzhsIdx: number | null;
  cascadeValue: {
    id: number | string;
    name: string;
    code: string;
  } | null;
}

export interface CascadeCheckResponse {
  hasCascade: boolean;
  mainInfo: {
    mainTableId: string;
    mainValueId: number;
    mainValueName: string;
  };
  cascadeResults: CascadeValueResult[];
}
