import React, { useRef } from 'react';

interface FixedHeaderProps {
  columns: string[];
  columnWidths: Record<string, string>;
  onColumnResize: (column: string, e: React.MouseEvent) => void;
  isResizing: string | null;
}

const FixedHeader: React.FC<FixedHeaderProps> = ({ columns, columnWidths, onColumnResize, isResizing }) => {
  const headerRef = useRef<HTMLTableElement>(null);

  return (
    <div 
      ref={headerRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'hidden'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {/* 行号列 */}
            <th 
              style={{ 
                padding: '8px', 
                border: '1px solid var(--border-color)', 
                textAlign: 'left', 
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                width: columnWidths['rowNumber'] || '60px',
                position: 'relative',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              Row
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '5px',
                  cursor: 'col-resize',
                  backgroundColor: isResizing === 'rowNumber' ? 'var(--brand-primary)' : 'transparent'
                }}
                onMouseDown={(e) => onColumnResize('rowNumber', e)}
              />
            </th>
            {/* 数据列 */}
            {columns.map((column) => (
              <th 
                key={column} 
                style={{ 
                  padding: '8px', 
                  border: '1px solid var(--border-color)', 
                  textAlign: 'left', 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  width: columnWidths[column] || 'auto',
                  position: 'relative',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                {column}
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    cursor: 'col-resize',
                    backgroundColor: isResizing === column ? 'var(--brand-primary)' : 'transparent'
                  }}
                  onMouseDown={(e) => onColumnResize(column, e)}
                />
              </th>
            ))}
            {/* 操作列 */}
            <th 
              style={{ 
                padding: '8px', 
                border: '1px solid var(--border-color)', 
                textAlign: 'left', 
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                width: columnWidths['action'] || '100px',
                position: 'relative',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              操作
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '5px',
                  cursor: 'col-resize',
                  backgroundColor: isResizing === 'action' ? 'var(--brand-primary)' : 'transparent'
                }}
                onMouseDown={(e) => onColumnResize('action', e)}
              />
            </th>
          </tr>
        </thead>
      </table>
    </div>
  );
};

export default FixedHeader;
