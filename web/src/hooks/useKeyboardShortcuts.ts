import { useEffect, useCallback, useRef } from 'react';
import { useCommandStack } from '../stores/commandStack';
import { useDiagramStore } from '../stores/diagramStore';
import { useModelStore } from '../stores/modelStore';
import { useUIStore } from '../stores/uiStore';

// ============================================================================
// Keyboard shortcut definitions
// ============================================================================

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: (e: KeyboardEvent) => boolean; // return true to preventDefault
}

// ============================================================================
// Hook
// ============================================================================

export function useKeyboardShortcuts(): void {
  const { undo, redo, canUndo, canRedo } = useCommandStack();
  const {
    selectedElementIds,
    deselectAll,
    selectAll,
    toggleGrid,
    toggleSnap,
    deleteDiagramElement,
  } = useDiagramStore();
  const { model, createModel, exportModel } = useModelStore();
  const {
    toggleToolbar,
    toggleStatusbar,
    toggleRulers,
  } = useUIStore();

  // Track stores that may change
  const canUndoRef = useRef(false);
  const canRedoRef = useRef(false);
  canUndoRef.current = canUndo();
  canRedoRef.current = canRedo();

  const shortcuts: KeyboardShortcut[] = [
    // Undo
    {
      key: 'z',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if (canUndoRef.current) {
          undo();
          return true;
        }
        return false;
      },
    },
    // Redo
    {
      key: 'y',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if (canRedoRef.current) {
          redo();
          return true;
        }
        return false;
      },
    },
    // Save
    {
      key: 's',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if (model) exportModel();
        return true;
      },
    },
    // New
    {
      key: 'n',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        createModel();
        return true;
      },
    },
    // Cut
    {
      key: 'x',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches('input, textarea')) return false;
        if (selectedElementIds.length === 0) return false;
        selectedElementIds.forEach((id) => deleteDiagramElement(id));
        return true;
      },
    },
    // Copy
    {
      key: 'c',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches('input, textarea')) return false;
        return selectedElementIds.length > 0;
      },
    },
    // Paste
    {
      key: 'v',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches('input, textarea')) return false;
        return false;
      },
    },
    // Select All
    {
      key: 'a',
      ctrl: true,
      action: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches('input, textarea')) return false;
        selectAll();
        return true;
      },
    },
    // Delete
    {
      key: 'Delete',
      action: (e: KeyboardEvent) => {
        if (selectedElementIds.length > 0) {
          selectedElementIds.forEach((id) => deleteDiagramElement(id));
          return true;
        }
        return false;
      },
    },
    // Toggle Grid
    {
      key: 'g',
      ctrl: true,
      action: () => {
        toggleGrid();
        return true;
      },
    },
    // Toggle Snap
    {
      key: 's',
      shift: true,
      ctrl: true,
      action: () => {
        toggleSnap();
        return true;
      },
    },
    // Toggle Toolbar
    {
      key: 't',
      ctrl: true,
      action: () => {
        toggleToolbar();
        return true;
      },
    },
    // Escape (deselect)
    {
      key: 'Escape',
      action: () => {
        deselectAll();
        return true;
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const isMeta = e.metaKey || e.ctrlKey;
        const isCtrl = isMeta;
        const isShift = e.shiftKey;
        const isAlt = e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (
          keyMatch &&
          (!!shortcut.ctrl === !!isCtrl) &&
          (!!shortcut.shift === !!isShift) &&
          (!!shortcut.alt === !!isAlt) &&
          (!!shortcut.meta === !!isMeta)
        ) {
          const shouldPrevent = shortcut.action(e);
          if (shouldPrevent) {
            e.preventDefault();
            return;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
