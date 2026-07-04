import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArchiMateElementType } from '../../types/archimate';
import { useModelStore } from '../../stores/modelStore';
import { useCommandStack } from '../../stores/commandStack';
import { useDiagramStore } from '../../stores/diagramStore';
import { useUIStore } from '../../stores/uiStore';
import './Toolbar.css';

// ============================================================================
// Types
// ============================================================================

interface MenuItem {
  id: string;
  label?: string;
  shortcut?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean | (() => boolean);
  divider?: boolean;
  submenu?: SubMenuItem[];
  checkable?: boolean;
  checked?: () => boolean;
}

interface SubMenuItem {
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

// ============================================================================
// Dropdown Menu Component
// ============================================================================

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps & { children?: React.ReactNode }> = ({
  trigger,
  items,
  align = 'left',
  className = '',
  children,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleAction = useCallback(
    (item: MenuItem | SubMenuItem) => {
      if (item.action && !(item.disabled as () => boolean)?.()) {
        item.action();
        if (!('submenu' in item)) {
          setOpen(false);
        }
      }
    },
    [],
  );

  // Render a single menu item
  const renderItem = useCallback(
    (item: MenuItem | SubMenuItem, depth: number = 0) => {
      if (item.divider) {
        return <div key={item.id} className="menu-divider" />;
      }

      const disabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;
      const checked = item.checkable && typeof item.checked === 'function' ? item.checked() : false;
      const hasSubmenu = (item as MenuItem).submenu;

      return (
        <div
          key={item.id}
          className={`menu-item${disabled ? ' disabled' : ''}${checked ? ' checked' : ''}${hasSubmenu ? ' has-submenu' : ''}`}
          style={hasSubmenu ? { paddingLeft: depth * 16 + 8 } : {}}
          onClick={() => !disabled && handleAction(item)}
          role="menuitem"
          aria-disabled={disabled}
        >
          {item.icon && <span className="menu-item-icon">{item.icon}</span>}
          <span className="menu-item-label">{item.label}</span>
          {item.shortcut && <span className="menu-item-shortcut">{item.shortcut}</span>}
          {checked && <span className="menu-item-check">✓</span>}
          {hasSubmenu && <span className="menu-item-arrow">▶</span>}
        </div>
      );
    },
    [handleAction],
  );

  return (
    <div
      ref={triggerRef}
      className={`toolbar-dropdown ${className}`}
      style={{ textAlign: align === 'right' ? 'right' : 'left' }}
    >
      <div
        className="toolbar-dropdown-trigger"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        {trigger}
      </div>

      {open && (
        <div
          ref={menuRef}
          className={`toolbar-dropdown-menu ${align === 'right' ? 'align-right' : 'align-left'}`}
          role="menu"
        >
          {items.map((item) => {
            if ((item as MenuItem).submenu) {
              // Main menu item with submenu
              return renderItem(item, 0);
            }
            return renderItem(item, 0);
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Toolbar Component
// ============================================================================

export interface ToolbarProps {
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ className = '' }) => {
  const { model, isDirty, createModel, clearModel, setModel, exportModel, markClean } =
    useModelStore();
  const { undo, redo, canUndo: canUndoStack, canRedo: canRedoStack } = useCommandStack();
  const {
    view,
    zoomIn,
    zoomOut,
    zoomFit,
    toggleGrid,
    toggleSnap,
    gridVisible,
    gridSnap,
    selectedElementIds,
    deselectAll,
    selectAll,
    addDiagramElement,
    updateDiagramElement,
    deleteDiagramElement,
    connectionRouter,
    setView,
  } = useDiagramStore();
  const {
    toggleToolbar: toggleToolbarVisibility,
    toggleStatusbar,
    toggleRulers,
    showStatusbar,
    showRulers,
    showToolbar,
    openModal,
    openDialog,
    preferences,
  } = useUIStore();

  const [showFullscreen, setShowFullscreen] = useState(false);

  // ── File Actions ────────────────────────────────────────────────

  const handleNew = useCallback(() => {
    if (isDirty && model) {
      openModal('unsaved-changes');
    } else {
      createModel();
    }
  }, [isDirty, model, openModal, createModel]);

  const handleOpen = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.archi,.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const content = await file.text();
        const parsed = JSON.parse(content);
        setModel(parsed);
      };
      input.click();
    } catch (e) {
      console.error('Failed to open file:', e);
    }
  }, [setModel]);

  const handleSave = useCallback(async () => {
    if (!model) return;
    try {
      const content = JSON.stringify(model, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (model.name || 'model') + '.archi';
      a.click();
      URL.revokeObjectURL(url);
      markClean();
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }, [model, markClean]);

  const handleSaveAs = useCallback(async () => {
    if (!model) return;
    openDialog('save-as');
  }, [model, openDialog]);

  const handleImport = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.archi';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const content = await file.text();
        const parsed = JSON.parse(content);
        setModel(parsed);
      };
      input.click();
    } catch (e) {
      console.error('Import failed:', e);
    }
  }, [setModel]);

  const handleExportArchimate = useCallback(async () => {
    if (!model) return;
    try {
      const content = JSON.stringify(model, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (model.name || 'model') + '.archi';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [model]);

  const handleExportSvg = useCallback(() => {
    const { exportSVG } = useDiagramStore.getState();
    const svg = exportSVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPng = useCallback(() => {
    const { exportPNG } = useDiagramStore.getState();
    exportPNG((dataUrl) => {
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'diagram.png';
      a.click();
    });
  }, []);

  // ── Edit Actions ───────────────────────────────────────────────

  const handleCut = useCallback(() => {
    // Copy to clipboard then delete
    const ids = useDiagramStore.getState().selectedElementIds;
    if (ids.length === 0) return;
    // Copy selected elements data
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const elements = diagram.elements.filter((el) => ids.includes(el.id));
    try {
      navigator.clipboard.writeText(JSON.stringify(elements));
    } catch {
      /* clipboard not available */
    }
    ids.forEach((id) => deleteDiagramElement(id));
  }, [deleteDiagramElement]);

  const handleCopy = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    if (ids.length === 0) return;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const elements = diagram.elements.filter((el) => ids.includes(el.id));
    try {
      navigator.clipboard.writeText(JSON.stringify(elements));
    } catch {
      /* clipboard not available */
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const elements = JSON.parse(text);
      const diagramStore = useDiagramStore.getState();
      const diagram = diagramStore.activeDiagram;
      if (!diagram || !Array.isArray(elements)) return;

      for (const el of elements) {
        const newId = crypto.randomUUID();
        diagramStore.addDiagramElement(newId, el.x + 20, el.y + 20, {
          elementId: el.elementId,
          ...el,
          id: newId,
        });
      }
    } catch {
      /* clipboard parse error */
    }
  }, []);

  const handleDelete = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    ids.forEach((id) => deleteDiagramElement(id));
  }, [deleteDiagramElement]);

  const handleDuplicate = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram || ids.length === 0) return;

    for (const el of diagram.elements.filter((e) => ids.includes(e.id))) {
      const newId = crypto.randomUUID();
      const store = useDiagramStore.getState();
      store.addDiagramElement(newId, el.x + 15, el.y + 15, {
        ...el,
        id: newId,
      });
    }
  }, []);

  // ── View Actions ──────────────────────────────────────────────

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setShowFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setShowFullscreen(false);
    }
  }, []);

  // ── Z-Order Actions ────────────────────────────────────────────

  const bringForward = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const zIndexes = ids.map((id) =>
      diagram.elements.find((e) => e.id === id)?.zIndex ?? 0,
    );
    if (zIndexes.length === 0) return;
    const nextZ = Math.max(...zIndexes) + 1;
    ids.forEach((id, i) => {
      updateDiagramElement(id, { zIndex: zIndexes[i] + 1 });
    });
  }, [updateDiagramElement]);

  const sendBack = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    const diagram = useDiagramStore.getState().activeDiagram;
    if (!diagram) return;
    const zIndexes = ids.map((id) =>
      diagram.elements.find((e) => e.id === id)?.zIndex ?? 0,
    );
    if (zIndexes.length === 0) return;
    ids.forEach((id, i) => {
      updateDiagramElement(id, { zIndex: Math.max(0, zIndexes[i] - 1) });
    });
  }, [updateDiagramElement]);

  const sendToBack = useCallback(() => {
    const ids = useDiagramStore.getState().selectedElementIds;
    ids.forEach((id) => updateDiagramElement(id, { zIndex: 0 }));
  }, [updateDiagramElement]);

  // ── Menu Definitions ──────────────────────────────────────────

  const fileMenuItems: MenuItem[] = [
    { id: 'new', label: 'New', shortcut: 'Ctrl+N', icon: '📄', action: handleNew },
    { id: 'open', label: 'Open', shortcut: 'Ctrl+O', icon: '📂', action: handleOpen },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: '💾', action: handleSave, disabled: !model },
    { id: 'save-as', label: 'Save As', shortcut: 'Ctrl+Shift+S', icon: '💾', action: handleSaveAs, disabled: !model },
    { id: 'file-divider-1', divider: true },
    { id: 'import', label: 'Import (.archi)', icon: '📥', action: handleImport },
    { id: 'export-archi', label: 'Export (.archi)', icon: '📤', action: handleExportArchimate, disabled: !model },
    { id: 'export-svg', label: 'Export SVG', icon: '🖼️', action: handleExportSvg, disabled: !model },
    { id: 'export-png', label: 'Export PNG', icon: '🖼️', action: handleExportPng, disabled: !model },
  ];

  const editMenuItems: MenuItem[] = [
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', icon: '↩️', action: undo, disabled: () => !canUndoStack() },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', icon: '↪️', action: redo, disabled: () => !canRedoStack() },
    { id: 'edit-divider-1', divider: true },
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', icon: '✂️', action: handleCut, disabled: () => selectedElementIds.length === 0 },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', icon: '📋', action: handleCopy, disabled: () => selectedElementIds.length === 0 },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', icon: '📋', action: handlePaste },
    { id: 'delete', label: 'Delete', shortcut: 'Del', icon: '🗑️', action: handleDelete, disabled: () => selectedElementIds.length === 0 },
    { id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A', icon: '☐', action: selectAll },
    { id: 'edit-divider-2', divider: true },
    // Submenu for element properties
    {
      id: 'element-format',
      label: 'Element Properties',
      icon: '🎨',
      submenu: [
        { id: 'text-align-left', label: 'Text Align Left', icon: '⫷', action: () => {} },
        { id: 'text-align-center', label: 'Text Align Center', icon: '⫿', action: () => {} },
        { id: 'text-align-right', label: 'Text Align Right', icon: '⫸', action: () => {} },
        { id: 'font-divider', divider: true },
        { id: 'font', label: 'Font...', icon: 'A', action: () => {} },
        { id: 'border-color', label: 'Border Color...', icon: '🎨', action: () => {} },
        { id: 'fill-color', label: 'Fill Color...', icon: '🎨', action: () => {} },
        { id: 'opacity', label: 'Opacity...', icon: '◐', action: () => {} },
        { id: 'line-width', label: 'Line Width...', icon: '━', action: () => {} },
        { id: 'router', label: 'Connection Router...', icon: '⤷', action: () => {} },
        { id: 'text-position', label: 'Text Position...', icon: '⊹', action: () => {} },
      ],
    },
    { id: 'edit-divider-3', divider: true },
    // Z-Order submenu
    {
      id: 'z-order',
      label: 'Z-Order',
      icon: '⇅',
      submenu: [
        { id: 'bring-forward', label: 'Bring Forward', action: bringForward },
        { id: 'send-back', label: 'Send Back', action: sendBack },
        { id: 'send-to-back', label: 'Send to Back', action: sendToBack },
      ],
    },
  ];

  const viewMenuItems: MenuItem[] = [
    { id: 'zoom-in', label: 'Zoom In', shortcut: 'Ctrl+=', icon: '🔍+', action: zoomIn },
    { id: 'zoom-out', label: 'Zoom Out', shortcut: 'Ctrl+-', icon: '🔍-', action: zoomOut },
    { id: 'zoom-fit', label: 'Fit to Page', shortcut: 'Ctrl+0', icon: '⬜', action: zoomFit },
    { id: 'view-divider-1', divider: true },
    { id: 'fullscreen', label: 'Full Screen', shortcut: 'F11', icon: '⛶', action: handleFullscreen },
    { id: 'view-divider-2', divider: true },
    {
      id: 'grid-toggle',
      label: 'Toggle Grid',
      icon: '🔲',
      checkable: true,
      checked: () => gridVisible,
      action: toggleGrid,
    },
    {
      id: 'snap-toggle',
      label: 'Snap to Grid',
      icon: '📌',
      checkable: true,
      checked: () => gridSnap,
      action: toggleSnap,
    },
    { id: 'view-divider-3', divider: true },
    {
      id: 'show-toolbar',
      label: 'Show Toolbar',
      icon: '🔧',
      checkable: true,
      checked: () => showToolbar,
      action: toggleToolbarVisibility,
    },
    {
      id: 'show-statusbar',
      label: 'Show Status Bar',
      icon: '📊',
      checkable: true,
      checked: () => showStatusbar,
      action: toggleStatusbar,
    },
    {
      id: 'show-rulers',
      label: 'Show Rulers',
      icon: '📏',
      checkable: true,
      checked: () => showRulers,
      action: toggleRulers,
    },
  ];

  return (
    <div className={`toolbar ${className}`} role="toolbar" aria-label="Application Toolbar">
      {/* ── Menu Bar ──────────────────────────────────────────── */}
      <div className="toolbar-menubar">
        <DropdownMenu trigger={<span className="toolbar-menu-label">File</span>} items={fileMenuItems} />
        <DropdownMenu trigger={<span className="toolbar-menu-label">Edit</span>} items={editMenuItems} />
        <DropdownMenu trigger={<span className="toolbar-menu-label">View</span>} items={viewMenuItems} />
      </div>

      {/* ── Action Bar ───────────────────────────────────────── */}
      <div className="toolbar-actions">
        {/* Quick Undo/Redo */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!canUndoStack()}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            ↩️ <span className="toolbar-btn-shortcut">Ctrl+Z</span>
          </button>
          <button
            className="toolbar-btn"
            disabled={!canRedoStack()}
            onClick={redo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            ↪️ <span className="toolbar-btn-shortcut">Ctrl+Y</span>
          </button>
        </div>

        {/* Quick Save */}
        <div className="toolbar-separator" />
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={handleSave}
            disabled={!model}
            title="Save (Ctrl+S)"
            aria-label="Save"
          >
            💾 <span className="toolbar-btn-shortcut">Ctrl+S</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        {/* Zoom controls */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={zoomIn} title="Zoom In (Ctrl+=)">
            🔍+
          </button>
          <button className="toolbar-btn" onClick={zoomOut} title="Zoom Out (Ctrl+-)">
            🔍-
          </button>
          <button className="toolbar-btn" onClick={zoomFit} title="Fit to Page">
            ⬜
          </button>
          <span className="toolbar-zoom-level">{Math.round(view.zoom * 100)}%</span>
        </div>

        <div className="toolbar-separator" />

        {/* Grid / Snap toggles */}
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${gridVisible ? 'active' : ''}`}
            onClick={toggleGrid}
            title="Toggle Grid"
            aria-pressed={gridVisible}
          >
            🔲
          </button>
          <button
            className={`toolbar-btn ${gridSnap ? 'active' : ''}`}
            onClick={toggleSnap}
            title="Snap to Grid"
            aria-pressed={gridSnap}
          >
            📌
          </button>
        </div>

        <div className="toolbar-separator" />

        {/* Fullscreen */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={handleFullscreen}
            title="Full Screen (F11)"
          >
            ⛶ <span className="toolbar-btn-shortcut">F11</span>
          </button>
        </div>

        {/* Dirty indicator */}
        {isDirty && (
          <span className="toolbar-dirty-indicator" title="Unsaved changes">●</span>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
