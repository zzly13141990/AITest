import React, { useEffect, useState } from 'react';
import { Card, Select, Input, Button, Space, Tag, Popconfirm, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useVouchStore } from '../store/vouchStore';
import type { CheckItem, CheckTypeInfo, OtherFzhsInfo, CheckOption } from '../types/vouch';

interface CheckAreaProps {
  detailIndex: number;
}

/**
 * PRD §10.1/§10.2: Dynamic check control rendering.
 *
 * Renders standard check dropdowns and other fzhs controls based on
 * SubjCheckConfig loaded when a subject is selected.
 */
const CheckAreaComponent: React.FC<CheckAreaProps> = ({ detailIndex }) => {
  const {
    details,
    detailCheckStates,
    addCheckItemToDetail,
    removeCheckItemFromDetail,
    updateCheckItemInDetail,
  } = useVouchStore();

  const detail = details[detailIndex];
  const checkState = detailCheckStates.get(detailIndex);
  const config = checkState?.subjConfig;

  if (!detail) return null;
  if (!detail.acctSubjCode) {
    return (
      <Card size="small" title="辅助核算" style={{ marginTop: 8 }}>
        <div style={{ color: '#999' }}>请先选择科目</div>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card size="small" title="辅助核算" style={{ marginTop: 8 }}>
        <div style={{ color: '#999' }}>加载科目配置中...</div>
      </Card>
    );
  }

  const hasStandard = config.checks && config.checks.length > 0;
  const hasOther = config.otherFzhsChecks && config.otherFzhsChecks.length > 0;

  if (!hasStandard && !hasOther) {
    return (
      <Card size="small" title="辅助核算" style={{ marginTop: 8 }}>
        <div style={{ color: '#999' }}>该科目无辅助核算配置</div>
      </Card>
    );
  }

  // Get existing check items for this detail
  const checkItems = detail.checkItems || [];

  // Standard checks that are already added
  const existingCheckIds = new Set(
    checkItems
      .filter((ci) => ci.checkItemType !== 'other')
      .flatMap((ci) => (ci.checkValues ? Object.keys(ci.checkValues).map(Number) : []))
  );

  // Other checks that are already added
  const existingOtherIdxs = new Set(
    checkItems
      .filter((ci) => ci.checkItemType === 'other')
      .map((ci) => ci.otherFzhsIdx)
      .filter(Boolean)
  );

  // Standard check controls
  const renderStandardCheck = (check: CheckTypeInfo) => {
    const isAdded = existingCheckIds.has(check.checkId);
    const options = checkState?.checkOptions.get(check.checkId) || [];

    if (!isAdded) {
      return null; // Will show as "add" button
    }

    // Find the check item that contains this check_id value
    const checkItem = checkItems.find((ci) => ci.checkValues && ci.checkValues[check.checkId] !== undefined);
    const currentValue = checkItem?.checkValues?.[check.checkId];
    const checkItemIndex = checkItems.findIndex((ci) => ci === checkItem);

    return (
      <div key={`std-${check.checkId}`} style={{ marginBottom: 8 }}>
        <Form.Item label={check.checkName} style={{ marginBottom: 4 }}>
          <Space>
            <Select
              showSearch
              style={{ width: 240 }}
              placeholder={`选择${check.checkName}`}
              value={currentValue}
              onChange={(val) => {
                if (checkItemIndex >= 0) {
                  const newValues = { ...checkItems[checkItemIndex].checkValues };
                  newValues[check.checkId] = val;
                  updateCheckItemInDetail(detailIndex, checkItemIndex, { checkValues: newValues });
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
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => {
                if (checkItemIndex >= 0) {
                  removeCheckItemFromDetail(detailIndex, checkItemIndex);
                }
              }}
            />
          </Space>
        </Form.Item>
      </div>
    );
  };

  // Other fzhs controls
  const renderOtherFzhs = (other: OtherFzhsInfo) => {
    const isAdded = existingOtherIdxs.has(other.otherFzhsIdx);
    const checkItemIndex = checkItems.findIndex(
      (ci) => ci.checkItemType === 'other' && ci.otherFzhsIdx === other.otherFzhsIdx
    );
    const checkItem = checkItemIndex >= 0 ? checkItems[checkItemIndex] : null;

    if (!isAdded) return null;

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
        const update: Partial<CheckItem> = {};
        switch (other.otherFzhsIdx) {
          case 1: update.infoFzhs1 = val; break;
          case 2: update.infoFzhs2 = val; break;
          case 3: update.infoFzhs3 = val; break;
          case 4: update.infoFzhs4 = val; break;
          case 5: update.infoFzhs5 = val; break;
        }
        // PRD §5.4.3: Special field mapping for dates - also set orderDate
        if (other.checkTypeName === '日期' && val) {
          update.orderDate = val;
          update.occurDate = val;
        }
        // For 票据号 - set cheqNo and orderNo
        if (other.checkTypeName === '票据号' && val) {
          update.cheqNo = val;
          update.orderNo = val;
        }
        // For 回单号 - set receiptNo
        if (other.checkTypeName === '回单号' && val) {
          update.receiptNo = val;
        }
        updateCheckItemInDetail(detailIndex, checkItemIndex, update);
      }
    };

    const displayName = other.displayName || other.checkTypeName || `其他辅助核算${other.otherFzhsIdx}`;
    const isRequired = other.isRequire === 1;

    return (
      <div key={`other-${other.otherFzhsIdx}`} style={{ marginBottom: 8 }}>
        <Form.Item
          label={displayName}
          required={isRequired}
          style={{ marginBottom: 4 }}
        >
          <Space>
            {other.inputType === '4' ? (
              // Dict select (input_type=4)
              <Select
                style={{ width: 240 }}
                placeholder={`选择${displayName}`}
                value={getValue() || undefined}
                onChange={(val) => setValue(val)}
                options={(checkState?.dictOptions.get(other.otherFzhsIdx) || []).map((opt: CheckOption) => ({
                  value: opt.code || String(opt.id),
                  label: opt.name,
                }))}
                allowClear
              />
            ) : (
              // Text input (input_type=3 or default)
              <Input
                style={{ width: 240 }}
                placeholder={`输入${displayName}`}
                value={getValue()}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => {
                if (checkItemIndex >= 0) {
                  removeCheckItemFromDetail(detailIndex, checkItemIndex);
                }
              }}
            />
          </Space>
        </Form.Item>
      </div>
    );
  };

  // Available standard checks not yet added
  const availableStandardChecks = config.checks.filter(
    (c) => !existingCheckIds.has(c.checkId)
  );

  // Available other fzhs not yet added
  const availableOtherFzhs = config.otherFzhsChecks.filter(
    (o) => !existingOtherIdxs.has(o.otherFzhsIdx)
  );

  const handleAddStandardCheck = (checkId: number) => {
    const check = config.checks.find((c) => c.checkId === checkId);
    if (!check) return;

    const newCheckItem: CheckItem = {
      acctCheckId: null,
      line: 1,
      checkItemType: 'standard',
      summary: null,
      amtDebit: null,
      amtCredit: null,
      checkValues: {},
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
    addCheckItemToDetail(detailIndex, newCheckItem);
  };

  const handleAddOtherFzhs = (otherFzhsIdx: number) => {
    const other = config.otherFzhsChecks.find((o) => o.otherFzhsIdx === otherFzhsIdx);
    if (!other) return;

    const newCheckItem: CheckItem = {
      acctCheckId: null,
      line: 2 + (otherFzhsIdx - 1), // Line=2 for idx=1, Line=3 for idx=2, etc.
      checkItemType: 'other',
      summary: null,
      amtDebit: null,
      amtCredit: null,
      checkValues: {},
      otherFzhsIdx: otherFzhsIdx,
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
    addCheckItemToDetail(detailIndex, newCheckItem);
  };

  return (
    <Card
      size="small"
      title={`辅助核算 - ${config.acctSubjNameAll || config.acctSubjName || config.acctSubjCode}`}
      style={{ marginTop: 8 }}
    >
      {/* Standard checks */}
      {hasStandard && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
            标准辅助核算
            <Tag style={{ marginLeft: 8 }} color="blue">Line 1</Tag>
          </div>
          {config.checks.map(renderStandardCheck)}
          {availableStandardChecks.length > 0 && (
            <Select
              style={{ width: 240 }}
              placeholder="添加标准辅助核算..."
              value={undefined}
              onChange={(val: number) => handleAddStandardCheck(val)}
              options={availableStandardChecks.map((c) => ({
                value: c.checkId,
                label: c.checkName,
              }))}
            />
          )}
        </div>
      )}

      {/* Other fzhs */}
      {hasOther && (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
            其他辅助核算
            <Tag style={{ marginLeft: 8 }} color="green">Line 2+</Tag>
          </div>
          {config.otherFzhsChecks.map(renderOtherFzhs)}
          {availableOtherFzhs.length > 0 && (
            <Select
              style={{ width: 240 }}
              placeholder="添加其他辅助核算..."
              value={undefined}
              onChange={(val: number) => handleAddOtherFzhs(val)}
              options={availableOtherFzhs.map((o) => ({
                value: o.otherFzhsIdx,
                label: o.displayName || o.checkTypeName || `其他辅助核算${o.otherFzhsIdx}`,
              }))}
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default CheckAreaComponent;
