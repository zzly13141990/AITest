import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (draftName: string) => Promise<void>;
}

const DraftSaveModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [draftName, setDraftName] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    if (!draftName.trim()) {
      message.warning('请输入草稿名称');
      return;
    }
    setConfirmLoading(true);
    try {
      await onSave(draftName.trim());
      message.success('草稿保存成功');
      setDraftName('');
      onClose();
    } catch (err: any) {
      message.error(err?.message || '草稿保存失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setDraftName('');
    onClose();
  };

  return (
    <Modal
      title="保存草稿"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      okText="确认保存"
      cancelText="取消"
      destroyOnClose
    >
      <Input
        placeholder="请输入草稿名称"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onPressEnter={handleOk}
        autoFocus
        style={{ marginTop: 8 }}
      />
    </Modal>
  );
};

export default DraftSaveModal;
