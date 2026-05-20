import React, { useEffect, useState } from 'react';
import { Modal, Table, Spin, Typography, Space, Tag, Descriptions } from 'antd';
import dayjs from 'dayjs';
import { vouchApi } from '../api/vouchApi';
import type { VouchMain, VouchDetail, OperatorInfo } from '../types/vouch';

const { Text } = Typography;

interface Props {
  open: boolean;
  draftId: number | null;
  onClose: () => void;
}

const DraftPreviewModal: React.FC<Props> = ({ open, draftId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [vouchForm, setVouchForm] = useState<VouchMain | null>(null);
  const [details, setDetails] = useState<VouchDetail[]>([]);
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null);

  useEffect(() => {
    if (open && draftId != null) {
      loadDraft(draftId);
    }
  }, [open, draftId]);

  const loadDraft = async (id: number) => {
    setLoading(true);
    try {
      const res = await vouchApi.loadDraft(id);
      setVouchForm(res.data.vouch);
      setDetails(res.data.details);
      setOperatorInfo(res.data.operatorInfo);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '行号',
      key: 'rowNum',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Text>{index + 1}</Text>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      width: 200,
      render: (text: string | null) => text || '-',
    },
    {
      title: '科目编码',
      dataIndex: 'acctSubjCode',
      key: 'acctSubjCode',
      width: 130,
      render: (text: string | null) => text ? <Text code>{text}</Text> : '-',
    },
    {
      title: '借方金额',
      dataIndex: 'amtDebit',
      key: 'amtDebit',
      width: 140,
      align: 'right' as const,
      render: (val: number | null) =>
        val != null && val > 0 ? (
          <Text style={{ fontFamily: 'monospace' }}>{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '贷方金额',
      dataIndex: 'amtCredit',
      key: 'amtCredit',
      width: 140,
      align: 'right' as const,
      render: (val: number | null) =>
        val != null && val > 0 ? (
          <Text style={{ fontFamily: 'monospace' }}>{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const nonBlankDetails = details.filter(
    (d) => d.acctSubjCode || d.summary || (d.amtDebit != null && d.amtDebit > 0) || (d.amtCredit != null && d.amtCredit > 0)
  );
  const totalDebit = nonBlankDetails.reduce((sum, d) => sum + (d.amtDebit || 0), 0);
  const totalCredit = nonBlankDetails.reduce((sum, d) => sum + (d.amtCredit || 0), 0);

  return (
    <Modal
      title="草稿凭证预览"
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {vouchForm && (
          <>
            <Descriptions
              size="small"
              column={3}
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="凭证字">
                <Text>{vouchForm.vouchTypeId || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="凭证日期">
                <Text>{vouchForm.vouchDate ? dayjs(vouchForm.vouchDate).format('YYYY-MM-DD') : '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="附单据">
                <Text>{vouchForm.vouchBillNum ?? 0} 张</Text>
              </Descriptions.Item>
              <Descriptions.Item label="制单人">
                <Text>{operatorInfo?.name || operatorInfo?.account || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="orange">草稿</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey={(_, index) => String(index)}
              dataSource={nonBlankDetails}
              columns={columns}
              size="small"
              pagination={false}
              bordered
              scroll={{ y: 400 }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>合计</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong style={{ fontFamily: 'monospace' }}>
                        {totalDebit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <Text strong style={{ fontFamily: 'monospace' }}>
                        {totalCredit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12, color: '#999' }}>
              分录数：{nonBlankDetails.filter(d => d.acctSubjCode).length} 行
            </div>
          </>
        )}

        {!loading && !vouchForm && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            无法加载草稿数据
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default DraftPreviewModal;
