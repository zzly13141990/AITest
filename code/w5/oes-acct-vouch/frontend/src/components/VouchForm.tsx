import React from 'react';
import { Form, Input, InputNumber, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { useVouchStore } from '../store/vouchStore';

const VouchForm: React.FC = () => {
  const { vouchForm, updateVouchForm, mode } = useVouchStore();

  if (!vouchForm) return null;

  return (
    <div style={{ padding: '12px', background: '#fafafa', borderRadius: '6px' }}>
      <Form layout="inline" size="small">
        <Form.Item label="凭证号">
          <Input
            style={{ width: 120 }}
            value={mode === 'edit' ? `记-${vouchForm.vouchNo || ''}` : '自动生成'}
            disabled
          />
        </Form.Item>
        <Form.Item label="凭证日期">
          <DatePicker
            value={vouchForm.vouchDate ? dayjs(vouchForm.vouchDate) : null}
            onChange={(date) =>
              updateVouchForm({ vouchDate: date?.format('YYYY-MM-DD') || '' })
            }
          />
        </Form.Item>
        <Form.Item label="附件张数">
          <InputNumber
            min={0}
            value={vouchForm.vouchBillNum}
            onChange={(val) => updateVouchForm({ vouchBillNum: val || 0 })}
          />
        </Form.Item>
        <Form.Item label="凭证类型">
          <Select
            style={{ width: 120 }}
            value={vouchForm.vouchTypeId}
            onChange={(val) => updateVouchForm({ vouchTypeId: val })}
            options={[
              { value: 1, label: '记账凭证' },
              { value: 2, label: '收款凭证' },
              { value: 3, label: '付款凭证' },
              { value: 4, label: '转账凭证' },
            ]}
          />
        </Form.Item>
      </Form>
      <div style={{ marginTop: 8 }}>
        <Input
          style={{ width: '100%' }}
          placeholder="凭证摘要（选填）"
          value={vouchForm.summary || ''}
          onChange={(e) => updateVouchForm({ summary: e.target.value })}
        />
      </div>
    </div>
  );
};

export default VouchForm;
