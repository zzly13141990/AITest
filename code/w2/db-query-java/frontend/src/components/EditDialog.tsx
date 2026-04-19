import React, { useState, useEffect } from 'react';
import { QueryResult } from '../types';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QueryResult) => void;
  initialData?: QueryResult;
  columns: string[];
  title: string;
}

const EditDialog: React.FC<EditDialogProps> = ({ isOpen, onClose, onSave, initialData, columns, title }) => {
  const [formData, setFormData] = useState<QueryResult>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // 为新增操作初始化空表单
        const emptyData: QueryResult = {};
        columns.forEach(column => {
          emptyData[column] = '';
        });
        setFormData(emptyData);
      }
    }
  }, [initialData, columns, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (column: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '80%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {columns.map(column => (
              <div key={column} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>{column}</label>
                <input
                  type="text"
                  value={formData[column] || ''}
                  onChange={(e) => handleInputChange(column, e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#f5f5f5',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                border: '1px solid #4CAF50',
                borderRadius: '4px',
                background: '#4CAF50',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDialog;