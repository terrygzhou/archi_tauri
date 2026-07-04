import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArchiMateElementType, FOLDER_HIERARCHY, LAYER_COLORS } from '../../types/archimate';
import { useDiagramStore } from '../../stores/diagramStore';
import { useCommandStack } from '../../stores/commandStack';
import { useModelStore } from '../../stores/modelStore';
import './ContextMenu.css';

// ============================================================================
// Types
// ============================================================================

interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label?: string;
  shortcut?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean | (() => boolean);
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

export interface CanvasContextMenuProps {
  position: ContextMenuPosition | null;
  onClose?: () => void;
}

// ============================================================================
// Context Menu Generic Component
// ============================================================================

interface ContextMenuGenericProps {
  position: ContextMenuPosition;
  items: ContextMenuItem[];
  onClose?: () => void;
}

const ContextMenuGeneric: React.FC<ContextMenuGenericProps> = ({
  position,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const handleAction = useCallback(
    (item: ContextMenuItem) => {
      if (item.action && !item.disabled) {
        item.action();
        onClose?.();
      }
    },
    [onClose],
  );

  const renderItem = useCallback(
    (item: ContextMenuItem) => {
      if (item.divider) {
        return <div key={item.id} className="ctx-divider" />;
      }

      const disabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;

      return (
        <div
          key={item.id}
          className={`ctx-item${disabled ? ' disabled' : ''}${item.submenu ? ' has-submenu' : ''}`}
          onClick={() => !disabled && handleAction(item)}
          role="menuitem"
          aria-disabled={disabled}
        >
          {item.icon && <span className="ctx-item-icon">{item.icon}</span>}
          <span className="ctx-item-label">{item.label}</span>
          {item.shortcut && <span className="ctx-item-shortcut">{item.shortcut}</span>}
          {item.submenu && <span className="ctx-item-arrow">▶</span>}
        </div>
      );
    },
    [handleAction],
  );

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: Math.min(position.x, window.innerWidth - 240),
        top: Math.min(position.y, window.innerHeight - 400),
      }}
      role="menu"
    >
      {items.map(renderItem)}
    </div>
  );
};

// ============================================================================
// Canvas Context Menu — right-click on empty canvas
// ============================================================================

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ position, onClose }) => {
  const {
    activeDiagram,
    addDiagramElement,
    selectAll,
    deselectAll,
    updateDiagram,
  } = useDiagramStore();

  const { addElement } = useModelStore();
  const { execute } = useCommandStack();

  // Build "New Element" submenu from all layer types
  const newElementSubmenu = useMemo<ContextMenuItem[]>(() => {
    const items: ContextMenuItem[] = [];

    for (const [layer, types] of Object.entries(FOLDER_HIERARCHY)) {
      if (types.length === 0) continue;
      const color = LAYER_COLORS[layer as keyof typeof LAYER_COLORS];

      // Add section header as divider
      items.push({
        id: `layer-${layer}`,
        label: layer.charAt(0).toUpperCase() + layer.slice(1),
        icon: `●`,
        disabled: true,
      });

      for (const type of types) {
        const displayName = type
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        items.push({
          id: `new-${type}`,
          label: displayName,
          icon: `●`,
          action: () => {
            // Create element at center of active diagram
            if (!activeDiagram) return;
            const center = { x: 200, y: 200 };
            addDiagramElement(
              crypto.randomUUID(),
              center.x,
              center.y,
              {
                elementId: type,
                customStyle: { fillColor: color },
              },
            );
          },
        });
      }
    }

    return items;
  }, [activeDiagram, addDiagramElement]);

  const menuItems: ContextMenuItem[] = [
    {
      id: 'new-element',
      label: 'New Element',
      icon: '➕',
      submenu: newElementSubmenu,
    },
    { id: 'ctx-divider-1', divider: true },
    {
      id: 'paste',
      label: 'Paste',
      shortcut: 'Ctrl+V',
      icon: '📋',
      action: async () => {
        try {
          const text = await navigator.clipboard.readText();
          const elements = JSON.parse(text);
          const store = useDiagramStore.getState();
          if (!Array.isArray(elements)) return;
          for (const el of elements) {
            store.addDiagramElement(crypto.randomUUID(), el.x + 20, el.y + 20, el);
          }
        } catch {
          /* parse error */
        }
      },
    },
    {
      id: 'select-all',
      label: 'Select All',
      shortcut: 'Ctrl+A',
      icon: '☐',
      action: selectAll,
    },
    {
      id: 'deselect-all',
      label: 'Deselect All',
      shortcut: 'Esc',
      icon: '✕',
      action: deselectAll,
    },
    { id: 'ctx-divider-2', divider: true },
    {
      id: 'diagram-properties',
      label: 'Diagram Properties',
      icon: '⚙️',
      action: () => {
        // Open diagram properties dialog
        const store = useDiagramStore.getState();
        const diagram = store.activeDiagram;
        if (!diagram) return;
      },
    },
  ];

  if (!position) return null;
  return <ContextMenuGeneric position={position} items={menuItems} onClose={onClose} />;
};

export default CanvasContextMenu;
