import React, { useEffect, useState } from 'react';
import { Button, Space, Spin, Alert, Select, Divider, Typography, Tag, DatePicker, InputNumber, message, Modal } from 'antd';
import {
  SaveOutlined,
  PrinterOutlined,
  FileTextOutlined,
  TableOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useVouchStore, ensureMinRows } from '../store/vouchStore';
import { vouchApi } from '../api/vouchApi';
import DetailTable from '../components/DetailTable';
import AuxAccountingInfoTable from '../components/AuxAccountingInfoTable';
import CashFlowInfoTable from '../components/CashFlowInfoTable';
import AuxAccountingModal from '../components/AuxAccountingModal';
import DraftSaveModal from '../components/DraftSaveModal';
import DraftListModal from '../components/DraftListModal';
import DraftPreviewModal from '../components/DraftPreviewModal';

const { Text } = Typography;


/** 根据状态返回对应的 Tag 颜色 */
function statusTagColor(status: string): string {
  switch (status) {
    case '已审核': return 'green';
    case '已记账': return 'purple';
    case '待审': return 'orange';
    case '查看': return 'default';
    case '编辑': return 'blue';
    case '制单': return 'blue';
    default: return 'blue';
  }
}

const VoucherEntryPage: React.FC = () => {
  const {
    mode,
    loading,
    error,
    details,
    vouchForm,
    operatorInfo,
    loadVouch,
    saveVouch,
    reset,
    clearError,
    updateVouchForm,
    vouchTypes,
    loadVouchTypes,
    selectedRow,
    detailCheckStates,
    readonly,
    vouchStatusText,
    auditVouch,
    unauditVouch,
  } = useVouchStore();

  const [vouchDate, setVouchDate] = useState<string>(vouchForm?.vouchDate || dayjs().format('YYYY-MM-DD'));
  const [billCount, setBillCount] = useState<number>(vouchForm?.vouchBillNum || 0);
  const [auxModalVisible, setAuxModalVisible] = useState<boolean>(false);
  const [draftSaveVisible, setDraftSaveVisible] = useState(false);
  const [draftListVisible, setDraftListVisible] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [previewDraftId, setPreviewDraftId] = useState<number | null>(null);
  const [draftConfirmVisible, setDraftConfirmVisible] = useState(false);
  const [pendingDraftId, setPendingDraftId] = useState<number | null>(null);

  useEffect(() => {
    // 如果 URL 中有 vouchId 参数，由 App.tsx 的 initParams 负责加载
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('vouchId')) {
      loadVouch();
    }
    loadVouchTypes();
  }, []);

  useEffect(() => {
    return () => {
      vouchApi.logOperation('退出凭证录入', '凭证管理', '用户退出页面');
    };
  }, []);

  useEffect(() => {
    if (vouchTypes.length > 0 && vouchForm && !vouchForm.vouchTypeId) {
      updateVouchForm({ vouchTypeId: vouchTypes[0].vouchTypeId });
    }
  }, [vouchTypes, vouchForm]);

  useEffect(() => {
    if (vouchForm?.vouchDate) {
      setVouchDate(vouchForm.vouchDate);
    }
    if (vouchForm?.vouchBillNum != null) {
      setBillCount(vouchForm.vouchBillNum);
    }
  }, [vouchForm]);

  const handleSave = async () => {
    try {
      const result = await saveVouch();
      message.success(`凭证保存成功，凭证号：${result.vouchNo}`);
    } catch {
      // Error is handled in store
    }
  };

  const handleSaveAndAudit = async () => {
    try {
      const result = await saveVouch();
      message.success(`凭证保存并审核成功，凭证号：${result.vouchNo}`);
    } catch {
      // Error is handled in store
    }
  };

  const handleSaveAndNew = async () => {
    try {
      await saveVouch();
      reset();
      loadVouch();
    } catch {
      // Error is handled in store
    }
  };

  const handlePrint = () => {
    vouchApi.logOperation('打印凭证', '凭证管理', `凭证号: ${vouchForm?.vouchNo || ''}`);
    window.print();
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    const newDate = date?.format('YYYY-MM-DD') || '';
    setVouchDate(newDate);
    updateVouchForm({ vouchDate: newDate });
  };

  const handleBillCountChange = (val: number | null) => {
    setBillCount(val || 0);
    updateVouchForm({ vouchBillNum: val || 0 });
  };

  /** 保存草稿 */
  const handleSaveDraft = async (draftName: string) => {
    const state = useVouchStore.getState();
    const nonBlankDetails = state.details.filter(
      (d) => d.acctSubjCode || d.summary || (d.amtDebit != null && d.amtDebit > 0) || (d.amtCredit != null && d.amtCredit > 0)
    );

    // Ensure vouchDate is ISO-8601 format (YYYY-MM-DDTHH:mm:ss) for backend LocalDateTime deserialization
    const rawDate = state.vouchForm?.vouchDate;
    const formattedVouchDate = rawDate
      ? dayjs(rawDate).format('YYYY-MM-DDTHH:mm:ss')
      : dayjs().format('YYYY-MM-DDTHH:mm:ss');

    const request = {
      draft: {
        draftId: null,
        draftName,
        compCode: state.vouchForm?.compCode || '',
        copyCode: state.vouchForm?.copyCode || '',
        acctYear: state.vouchForm?.acctYear || '',
        acctMonth: state.vouchForm?.acctMonth || '',
        vouchNo: state.vouchForm?.vouchNo || null,
        vouchDate: formattedVouchDate,
        vouchBillNum: state.vouchForm?.vouchBillNum || 0,
        vouchTypeId: state.vouchForm?.vouchTypeId || 0,
        vouchSourceCode: '01',
        accManager: state.vouchForm?.accManager || null,
        operator: state.vouchForm?.operator || null,
        modifier: state.vouchForm?.modifier || null,
        teller: state.vouchForm?.teller || null,
        typeAttr: 0,
        summary: null,
        auditor: null,
        poster: null,
      },
      details: nonBlankDetails.map((d) => ({
        vouchDetailId: null,
        vouchPage: d.vouchPage,
        vouchRow: d.vouchRow,
        summary: d.summary || null,
        acctSubjCode: d.acctSubjCode || null,
        amtDebit: d.amtDebit || null,
        amtCredit: d.amtCredit || null,
        checkItems: (d.checkItems || []).map((ci) => ({
          acctCheckId: null,
          line: ci.line,
          checkItemType: ci.checkItemType || 'standard',
          summary: ci.summary || null,
          amtDebit: ci.amtDebit || null,
          amtCredit: ci.amtCredit || null,
          checkValues: ci.checkValues || {},
          otherFzhsIdx: ci.otherFzhsIdx || null,
          infoFzhs1: ci.infoFzhs1 || null,
          infoFzhs2: ci.infoFzhs2 || null,
          infoFzhs3: ci.infoFzhs3 || null,
          infoFzhs4: ci.infoFzhs4 || null,
          infoFzhs5: ci.infoFzhs5 || null,
          orderNo: ci.orderNo || null,
          orderDate: ci.orderDate || null,
          payTypeId: ci.payTypeId || null,
          cheqNo: ci.cheqNo || null,
          receiptNo: ci.receiptNo || null,
          occurDate: ci.occurDate || null,
        })),
      })),
    };
    await vouchApi.saveDraft(request, state.account);
  };

  /** 取草稿 - 加载草稿到当前凭证 */
  const handleLoadDraft = async (draftId: number, action: 'replace' | 'append') => {
    setLoadingDraft(true);
    try {
      const res = await vouchApi.loadDraft(draftId);
      const state = useVouchStore.getState();

      let combinedDetails: typeof res.data.details;
      if (action === 'append') {
        // 追加：保留现有非空分录，草稿分录追加到末尾
        const existingDetails = state.details.filter(
          (d) => d.acctSubjCode || d.summary || d.amtDebit != null || d.amtCredit != null
        );
        combinedDetails = [...existingDetails, ...res.data.details];
      } else {
        // 覆盖：替换所有分录
        combinedDetails = res.data.details;
      }

      // 确保至少 6 条分录，重新编号 vouchRow
      const paddedDetails = ensureMinRows(combinedDetails).map((d, i) => ({ ...d, vouchRow: i + 1 }));

      // 找到第一个有科目的分录索引，用于自动选中
      const firstSubjIdx = paddedDetails.findIndex((d) => d.acctSubjCode != null);

      useVouchStore.setState({
        mode: 'create',
        vouchForm: res.data.vouch,
        details: paddedDetails,
        operatorInfo: res.data.operatorInfo,
        detailCheckStates: new Map(),
        selectedRow: firstSubjIdx >= 0 ? firstSubjIdx : 0,
        readonly: false,
      });

      // 逐行加载科目辅助核算配置，并等待全部完成
      const store = useVouchStore.getState();
      const checkPromises: Promise<void>[] = [];
      for (let i = 0; i < paddedDetails.length; i++) {
        if (paddedDetails[i].acctSubjCode) {
          checkPromises.push(store.loadSubjChecks(i));
        }
      }
      await Promise.all(checkPromises);
    } finally {
      setLoadingDraft(false);
    }
  };


  /** 审核凭证 */
  const handleAudit = () => {
    Modal.confirm({
      title: '确认审核',
      content: '确定要审核当前凭证吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => auditVouch(),
    });
  };

  /** 销审凭证 */
  const handleUnaudit = () => {
    Modal.confirm({
      title: '确认销审',
      content: '确定要销审当前凭证吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => unauditVouch(),
    });
  };

return (
    <div style={{ padding: '0 16px 16px 16px', maxWidth: 1400, margin: '0 auto', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={clearError}
          style={{ marginBottom: 12 }}
        />
      )}

      <Spin spinning={loading} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Top toolbar — Row 1: action buttons */}
        <div style={{
          padding: '8px 0',
          borderBottom: '1px solid #e8e8e8',
          marginBottom: 8,
        }}>
          <Space size={4} wrap>
            <Button type="primary" size="small" icon={<SaveOutlined />} disabled={readonly} onClick={handleSaveAndAudit}>
              保存并审核
            </Button>
            <Button size="small" icon={<SaveOutlined />} disabled={readonly} onClick={handleSave}>
              保存
            </Button>
            <Button size="small" disabled={readonly} onClick={handleSaveAndNew}>
              保存并新增
            </Button>
                        {mode === 'pending_audit' && (
              <>
                <Divider type="vertical" style={{ margin: '0 4px' }} />
                <Button size="small" type="primary" danger icon={<CheckOutlined />} onClick={handleAudit}>
                  审核
                </Button>
                <Button size="small" danger icon={<CloseOutlined />} onClick={handleUnaudit}>
                  销审
                </Button>
                <Divider type="vertical" style={{ margin: '0 4px' }} />
              </>
            )}
            <Button size="small" icon={<PrinterOutlined />} disabled>
              保存并打印
            </Button>
            <Button size="small" icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Button size="small" icon={<FileTextOutlined />} disabled>
              打印预览
            </Button>
            <Divider type="vertical" style={{ margin: '0 4px' }} />
            <Button
              size="small"
              icon={<TableOutlined />}
              disabled={
                readonly ||
                selectedRow == null ||
                (() => {
                  const cs = detailCheckStates.get(selectedRow ?? -1);
                  const cfg = cs?.subjConfig;
                  if (!cfg) return true;
                  return cfg.checks.length === 0 && cfg.otherFzhsChecks.length === 0;
                })()
              }
              onClick={() => {
                if (selectedRow != null) {
                  const selDetail = details[selectedRow];
                  if (selDetail?.acctSubjCode) {
                    const cs = detailCheckStates.get(selectedRow);
                    const cfg = cs?.subjConfig;
                    if (cfg && (cfg.checks.length > 0 || cfg.otherFzhsChecks.length > 0)) {
                      if (!readonly) {
                        setAuxModalVisible(true);
                      } else {
                        message.info('只读模式下仅可查看，不可编辑辅助核算');
                      }
                    } else {
                      message.warning('该科目未配置辅助核算');
                    }
                  } else {
                    message.warning('请先选择已录入科目的分录行');
                  }
                }
              }}
            >
              辅助核算
            </Button>
            <Divider type="vertical" style={{ margin: '0 4px' }} />
            <Button size="small" disabled={readonly} onClick={() => setDraftSaveVisible(true)}>
              保存草稿
            </Button>
            <Button size="small" onClick={() => setDraftListVisible(true)}>
              取草稿
            </Button>
          </Space>
        </div>

        {/* Voucher info + Title — single row: 凭证字/日期 | 记账凭证 | 状态/附单据 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 0 12px 0',
          borderBottom: '1px solid #e8e8e8',
          marginBottom: 12,
        }}>
          {/* Left: 凭证字 + 凭证日期 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>凭证字：</Text>
              <Select
                size="small"
                style={{ width: 140 }}
                value={vouchForm?.vouchTypeId}
                onChange={(val) => updateVouchForm({ vouchTypeId: val })}
                disabled={readonly}
                options={vouchTypes.map((vt) => ({
                  value: vt.vouchTypeId,
                  label: vt.vouchTypeName,
                }))}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>凭证号：</Text>
              <Text>{vouchForm?.vouchNo || '-'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>号</Text>
            </Space>
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>凭证日期</Text>
              <DatePicker
                size="small"
                value={vouchDate ? dayjs(vouchDate) : null}
                onChange={handleDateChange}
                disabled={readonly}
                style={{ width: 120 }}
              />
            </Space>
          </div>

          {/* Center: 记账凭证 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: 2 }}>
              记账凭证
            </span>
          </div>

          {/* Right: 状态 + 附单据 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>状态：</Text>
              <Tag color={statusTagColor(vouchStatusText)} style={{ margin: 0 }}>
                {vouchStatusText || (mode === 'edit' ? '编辑' : '制单')}
              </Tag>
            </Space>
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>附单据</Text>
              <InputNumber
                size="small"
                min={0}
                value={billCount}
                onChange={handleBillCountChange}
                disabled={readonly}
                style={{ width: 50 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>张</Text>
            </Space>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <DetailTable />
        </div>

      
        {/* Bottom: approver info — moved below table */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 0',
          borderTop: '1px solid #e8e8e8',
          fontSize: 12,
        }}>
          <Space size={24}>
            <Space size={4}>
              <Text type="secondary">主管：</Text>
              <Text>{vouchForm?.accManager || '-'}</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">记账人：</Text>
              <Text>{vouchForm?.poster || ''}</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">审核人：</Text>
              <Text>{vouchForm?.auditor || ''}</Text>
            </Space>
          </Space>

          <Space size={16}>
            <Space size={4}>
              <Text type="secondary">制单人：</Text>
              <Text>{vouchForm?.operator || operatorInfo?.name || operatorInfo?.account || '-'}</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">财务/预算分录数：</Text>
              <Text>1/0</Text>
            </Space>
          </Space>
        </div>
        {/* Auxiliary accounting info / Cash flow info */}
        {selectedRow != null ? <AuxAccountingInfoTable /> : <CashFlowInfoTable />}
        </div>

        {/* Auxiliary Accounting Modal */}
        <AuxAccountingModal
          visible={auxModalVisible}
          detailIndex={selectedRow ?? 0}
          onClose={() => setAuxModalVisible(false)}
        />
      </Spin>

      {/* Draft Save Modal */}
      <DraftSaveModal
        visible={draftSaveVisible}
        onClose={() => setDraftSaveVisible(false)}
        onSave={handleSaveDraft}
      />

      {/* Draft List Modal */}
      <DraftListModal
        visible={draftListVisible}
        onClose={() => setDraftListVisible(false)}
        onSelect={async (draftId) => {
          // 【修复3】检查页面是否存在分录数据
          const state = useVouchStore.getState();
          const hasNonBlank = state.details.some(
            (d) => d.acctSubjCode || d.summary || d.amtDebit != null || d.amtCredit != null
          );
          if (hasNonBlank) {
            setPendingDraftId(draftId);
            setDraftConfirmVisible(true);
          } else {
            await handleLoadDraft(draftId, 'replace');
          }
        }}
        onView={async (draftId) => {
          setPreviewDraftId(draftId);
        }}
      />

      {/* Draft Preview Modal */}
      <DraftPreviewModal
        open={previewDraftId != null}
        draftId={previewDraftId}
        onClose={() => setPreviewDraftId(null)}
      />

      {/* 【修复3】覆盖/追加确认弹窗 */}
      <Modal
        title="已有分录数据"
        open={draftConfirmVisible}
        onCancel={() => setDraftConfirmVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setDraftConfirmVisible(false)}>取消</Button>
            <Button onClick={() => {
              setDraftConfirmVisible(false);
              handleLoadDraft(pendingDraftId!, 'append');
            }}>追加</Button>
            <Button type="primary" onClick={() => {
              setDraftConfirmVisible(false);
              handleLoadDraft(pendingDraftId!, 'replace');
            }}>覆盖</Button>
          </Space>
        }
      >
        <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
        当前页面已有分录数据，请选择操作方式：
      </Modal>

      {loadingDraft && <Spin size="large" style={{ position: 'fixed', top: '50%', left: '50%' }} />}
    </div>
  );
};

export default VoucherEntryPage;