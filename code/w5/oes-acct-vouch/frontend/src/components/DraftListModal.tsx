import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Table, Button, Space, message, Popconfirm } from 'antd';
import { useVouchStore } from '../store/vouchStore';
import type { DraftItem } from '../types/vouch';

const DISPLAY_ROWS = 10;
const ROW_HEIGHT = 40;
const SCROLL_Y = DISPLAY_ROWS * ROW_HEIGHT;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (draftId: number) => Promise<void>;
  onView: (draftId: number) => void;
}

interface PlaceholderRow {
  _placeholder: true;
  _key: number;
}

type TableRow = DraftItem | PlaceholderRow;

/** Check if a row is a placeholder row */
function isPlaceholder(row: TableRow): row is PlaceholderRow {
  return (row as PlaceholderRow)._placeholder === true;
}

/**
 * Pad data to DISPLAY_ROWS:
 * - If data has >= DISPLAY_ROWS items, return as-is.
 * - Otherwise, fill with placeholder rows up to DISPLAY_ROWS.
 */
function padData(data: DraftItem[]): TableRow[] {
  if (!data) return [];
  if (data.length >= DISPLAY_ROWS) return data;
  const padded: TableRow[] = [...data];
  for (let i = padded.length; i < DISPLAY_ROWS; i++) {
    padded.push({ _placeholder: true, _key: -(i + 1) });
  }
  return padded;
}

const DraftListModal: React.FC<Props> = ({ visible, onClose, onSelect, onView }) => {
  const { draftList, draftListLoading, loadDraftList, deleteDraft } = useVouchStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    if (visible) {
      loadDraftList();
      setSelectedRowKeys([]);
    }
  }, [visible]);

  const handleDelete = async (draftId: number) => {
    try {
      await deleteDraft(draftId);
      message.success('草稿删除成功');
    } catch (err: any) {
      message.error(err?.message || '草稿删除失败');
    }
  };

  const handleConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择一条草稿');
      return;
    }
    const draftId = selectedRowKeys[0];
    onClose();
    await onSelect(draftId);
  };

  /** Padded display data: ensures exactly DISPLAY_ROWS rows */
  const displayData = useMemo(() => padData(draftList), [draftList]);

  const columns = [
    {
      title: '草稿名称',
      dataIndex: 'draftName',
      key: 'draftName',
      render: (text: string, record: TableRow) => {
        if (isPlaceholder(record)) return null;
        return (
          <a
            onClick={() => {
              onView(record.draftId);
            }}
          >
            {text}
          </a>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'draftCreateTime',
      key: 'draftCreateTime',
      width: 180,
      render: (text: string, record: TableRow) => {
        if (isPlaceholder(record)) return null;
        return text;
      },
    },
    {
      title: '创建人',
      dataIndex: 'draftCreator',
      key: 'draftCreator',
      width: 120,
      render: (text: string, record: TableRow) => {
        if (isPlaceholder(record)) return null;
        return text;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: TableRow) => {
        if (isPlaceholder(record)) return null;
        return (
          <Popconfirm
            title="确定删除该草稿？"
            onConfirm={() => handleDelete(record.draftId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      title="取草稿"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleConfirm} disabled={selectedRowKeys.length === 0}>
            确认取草稿
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Table
        rowKey={(record: TableRow) => (isPlaceholder(record) ? record._key : record.draftId)}
        dataSource={displayData}
        columns={columns}
        loading={draftListLoading}
        size="small"
        rowSelection={{
          type: 'radio',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
          getCheckboxProps: (record: TableRow) => ({
            disabled: isPlaceholder(record),
          }),
        }}
        scroll={{ y: SCROLL_Y }}
        sticky
        pagination={false}
        style={{ marginTop: 8 }}
      />
    </Modal>
  );
};

export default DraftListModal;
