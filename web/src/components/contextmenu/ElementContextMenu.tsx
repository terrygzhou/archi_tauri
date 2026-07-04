import React, { useCallback, useMemo } from 'react';
import { ArchiMateElementType } from '../../types/archimate';
import { useDiagramStore } from '../../stores/diagramStore';
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
  checkable?: boolean;
  checked?: () => boolean;
}

export interface ElementContextMenuProps {
  position: ContextMenuPosition | null;
  elementId: string | null;
  elementType?: ArchiMateElementType;
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
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
      if (item.action) {
        const disabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;
        if (!disabled) {
          item.action();
          onClose?.();
        }
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
          className={`ctx-item${disabled ? ' disabled' : ''}${item.checked?.() ? ' checked' : ''}`}
          onClick={() => handleAction(item)}
          role="menuitem"
          aria-disabled={disabled}
        >
          {item.icon && <span className="ctx-item-icon">{item.icon}</span>}
          <span className="ctx-item-label">{item.label}</span>
          {item.shortcut && <span className="ctx-item-shortcut">{item.shortcut}</span>}
          {item.checkable && item.checked?.() && (
            <span className="ctx-item-check">✓</span>
          )}
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
// Element Context Menu — right-click on an element
// ============================================================================

export const ElementContextMenu: React.FC<ElementContextMenuProps> = ({
  position,
  elementId,
  elementType,
  onClose,
}) => {
  const {
    selectedElementIds,
    updateDiagramElement,
    deleteDiagramElement,
    getDiagram,
    activeDiagramId,
    moveElement,
  } = useDiagramStore();

  const isSelected = selectedElementIds.includes(elementId || '');

  // Find element data
  const element = useMemo(() => {
    if (!activeDiagramId) return null;
    const diagram = getDiagram(activeDiagramId);
    if (!diagram) return null;
    return diagram.elements.find((el) => el.id === elementId) ?? null;
  }, [activeDiagramId, elementId, getDiagram]);

  // ── Actions ──────────────────────────────────────────────────

  const handleCut = useCallback(() => {
    if (!elementId) return;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const el = diagram.elements.find((e) => e.id === elementId);
    if (!el) return;
    try {
      navigator.clipboard.writeText(JSON.stringify([el]));
    } catch {
      /* clipboard not available */
    }
    deleteDiagramElement(elementId);
  }, [elementId, deleteDiagramElement]);

  const handleCopy = useCallback(() => {
    if (!elementId) return;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const el = diagram.elements.find((e) => e.id === elementId);
    if (!el) return;
    try {
      navigator.clipboard.writeText(JSON.stringify([el]));
    } catch {
      /* clipboard not available */
    }
  }, [elementId]);

  const handleDelete = useCallback(() => {
    if (elementId) {
      deleteDiagramElement(elementId);
    }
  }, [elementId, deleteDiagramElement]);

  const handleDuplicate = useCallback(() => {
    if (!elementId) return;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const el = diagram.elements.find((e) => e.id === elementId);
    if (!el) return;
    useDiagramStore.getState().addDiagramElement(crypto.randomUUID(), el.x + 15, el.y + 15, {
      ...el,
      id: crypto.randomUUID(),
    });
  }, [elementId, element]);

  const handleBringForward = useCallback(() => {
    if (!element || !elementId) return;
    updateDiagramElement(elementId, { zIndex: (element.zIndex ?? 0) + 1 });
  }, [elementId, element, updateDiagramElement]);

  const handleSendBack = useCallback(() => {
    if (!element || !elementId) return;
    updateDiagramElement(elementId, {
      zIndex: Math.max(0, (element.zIndex ?? 0) - 1),
    });
  }, [elementId, element, updateDiagramElement]);

  const handleSendToBack = useCallback(() => {
    if (elementId) {
      updateDiagramElement(elementId, { zIndex: 0 });
    }
  }, [elementId, updateDiagramElement]);

  const handleToggleLock = useCallback(() => {
    if (!element || !elementId) return;
    updateDiagramElement(elementId, { locked: !element.locked });
  }, [elementId, element, updateDiagramElement]);

  const handleEditText = useCallback(() => {
    // Open inline editing — handled by diagram canvas
    if (!element || !elementId) return;
    // Could trigger a dialog or inline edit mode
    const store = useDiagramStore.getState();
    const diagram = store.activeDiagram;
    if (!diagram) return;
  }, [elementId, element]);

  // ── Menu Items ───────────────────────────────────────────────

  const menuItems: ContextMenuItem[] = [
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', icon: '✂️', action: handleCut },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', icon: '📋', action: handleCopy },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', icon: '📋', action: async () => {
      try {
        const text = await navigator.clipboard.readText();
        const elements = JSON.parse(text);
        const store = useDiagramStore.getState();
        if (!Array.isArray(elements)) return;
        for (const el of elements) {
          store.addDiagramElement(crypto.randomUUID(), el.x + 20, el.y + 20, el);
        }
      } catch { /* parse error */ }
    } },
    { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', icon: '📑', action: handleDuplicate },
    { id: 'elem-divider-1', divider: true },
    { id: 'delete', label: 'Delete', shortcut: 'Del', icon: '🗑️', action: handleDelete },
    { id: 'elem-divider-2', divider: true },
    {
      id: 'bring-forward',
      label: 'Bring Forward',
      icon: '⬆',
      action: handleBringForward,
      disabled: () => !element,
    },
    {
      id: 'send-back',
      label: 'Send Back',
      icon: '⬇',
      action: handleSendBack,
      disabled: () => !element || !element.zIndex,
    },
    {
      id: 'send-to-back',
      label: 'Send to Back',
      icon: '⬇',
      action: handleSendToBack,
      disabled: () => !element,
    },
    { id: 'elem-divider-3', divider: true },
    {
      id: 'lock-unlock',
      label: element?.locked ? 'Unlock' : 'Lock',
      icon: element?.locked ? '🔒' : '🔓',
      action: handleToggleLock,
      checkable: true,
      checked: () => element?.locked ?? false,
    },
    { id: 'elem-divider-4', divider: true },
    {
      id: 'properties',
      label: 'Properties',
      icon: '⚙️',
      action: handleEditText,
    },
    {
      id: 'edit-text',
      label: 'Edit Text',
      icon: '✏️',
      action: handleEditText,
    },
  ];

  if (!position || !elementId) return null;
  return <ContextMenuGeneric position={position} items={menuItems} onClose={onClose} />;
};

export default ElementContextMenu;
