import React, { useEffect, useRef } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, position, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (menuRef.current && visible) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      let newX = position.x;
      let newY = position.y;

      if (newX + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 10;
      }
      if (newY + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 10;
      }

      menu.style.left = `${newX}px`;
      menu.style.top = `${newY}px`;
    }
  }, [visible, position]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {items.map(item => (
        <div
          key={item.id}
          className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;