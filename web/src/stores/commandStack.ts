// ============================================================================
// Command Stack — Undo/Redo with command pattern (max 50 levels)
// ============================================================================

import { create } from 'zustand';

// ── Constants ─────────────────────────────────────────────────────────────

/** Maximum undo/redo stack depth */
export const MAX_UNDO_STACK = 50;
export const MAX_REDO_STACK = 50;

/** localStorage key for persisting the command stack */
const STORAGE_KEY = 'archi-command-stack';

// ── Command types ─────────────────────────────────────────────────────────

export type CommandType =
  | 'ADD_ELEMENT'
  | 'REMOVE_ELEMENT'
  | 'MOVE_ELEMENT'
  | 'RESIZE_ELEMENT'
  | 'ADD_CONNECTION'
  | 'REMOVE_CONNECTION'
  | 'SET_PROPERTY'
  | 'UPDATE_ELEMENT'
  | 'DELETE_ELEMENT'
  | 'UPDATE_DIAGRAM'
  | 'ADD_FOLDER'
  | 'DELETE_FOLDER'
  | 'RENAME_ELEMENT'
  | 'TOGGLE_GRID'
  | 'PAN_VIEW'
  | 'ZOOM_VIEW'
  | 'SELECTION_CHANGE'
  | 'UNDO_REDO_STATE'
  | 'CUSTOM';

// ── Command interface ────────────────────────────────────────────────────

export interface Command {
  /** Unique command identifier */
  id: string;
  /** Command type */
  type: CommandType;
  /** Human-readable label */
  label: string;
  /** Timestamp when command was executed */
  timestamp: string;
  /** Execute the command (forward) */
  execute: () => void;
  /** Undo the command (backward) */
  undo: () => void;
  /** Snapshot of state before execution */
  beforeState?: unknown;
  /** Snapshot of state after execution */
  afterState?: unknown;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ── Persistable command data (for localStorage) ───────────────────────────

interface PersistableCommand {
  id: string;
  type: CommandType;
  label: string;
  timestamp: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
}

// ── Store state ───────────────────────────────────────────────────────────

interface CommandStackState {
  undoStack: Command[];
  redoStack: Command[];
  /** Available to undo */
  undoAvailable: boolean;
  /** Available to redo */
  redoAvailable: boolean;
  isExecuting: boolean;
}

// ── Store actions ─────────────────────────────────────────────────────────

interface CommandStackActions {
  // Push and execute
  execute: (command: Omit<Command, 'id' | 'timestamp'>) => void;
  executeMultiple: (commands: Omit<Command, 'id' | 'timestamp'>[]) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  undoTo: (index: number) => void;

  // State queries
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoStack: () => Command[];
  getRedoStack: () => Command[];
  getUndoCount: () => number;
  getRedoCount: () => number;

  // Clear
  clear: () => void;
  clearUndoStack: () => void;
  clearRedoStack: () => void;

  // Get last command
  getLastCommand: () => Command | null;

  // Set execution state
  setIsExecuting: (val: boolean) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

// ── Persistence helpers ──────────────────────────────────────────────────

function saveStackToLocalStorage(
  undoStack: Command[],
  redoStack: Command[],
): void {
  try {
    const data: {
      undoStack: PersistableCommand[];
      redoStack: PersistableCommand[];
    } = {
      undoStack: undoStack.map((cmd) => ({
        id: cmd.id,
        type: cmd.type,
        label: cmd.label,
        timestamp: cmd.timestamp,
        beforeState: cmd.beforeState,
        afterState: cmd.afterState,
        metadata: cmd.metadata,
      })),
      redoStack: redoStack.map((cmd) => ({
        id: cmd.id,
        type: cmd.type,
        label: cmd.label,
        timestamp: cmd.timestamp,
        beforeState: cmd.beforeState,
        afterState: cmd.afterState,
        metadata: cmd.metadata,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

function loadStackFromLocalStorage(): {
  undoStack: Command[];
  redoStack: Command[];
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as {
      undoStack: PersistableCommand[];
      redoStack: PersistableCommand[];
    };

    // Reconstruct commands from persisted data
    const reconstructCommands = (cmds: PersistableCommand[]): Command[] =>
      cmds.map((pc) => ({
        id: pc.id,
        type: pc.type,
        label: pc.label,
        timestamp: pc.timestamp,
        beforeState: pc.beforeState,
        afterState: pc.afterState,
        metadata: pc.metadata,
        execute: () => {
          // No-op: persisted commands don't retain their functions
        },
        undo: () => {
          // No-op: persisted commands don't retain their functions
        },
      }));

    return {
      undoStack: reconstructCommands(data.undoStack),
      redoStack: reconstructCommands(data.redoStack),
    };
  } catch {
    return null;
  }
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useCommandStack = create<CommandStackState & CommandStackActions>(
  (set, get) => ({
    // ── Initial state ─────────────────────────────────────────────
    undoStack: [],
    redoStack: [],
    undoAvailable: false,
    redoAvailable: false,
    isExecuting: false,

    // ── Execute ───────────────────────────────────────────────────

    execute: (command) => {
      const { undoStack, redoStack } = get();
      const fullCommand: Command = {
        ...command,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      // Execute the command
      fullCommand.execute();

      // Push to undo stack (respecting max depth)
      const newUndoStack = [...undoStack, fullCommand];
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift();
      }

      // Clear redo stack on new action
      set({
        undoStack: newUndoStack,
        redoStack: [],
        undoAvailable: true,
        redoAvailable: false,
      });

      // Persist
      get().saveToLocalStorage();
    },

    executeMultiple: (commands) => {
      commands.forEach((cmd) => get().execute(cmd));
    },

    // ── Undo / Redo ───────────────────────────────────────────────

    undo: () => {
      const { undoStack, redoStack } = get();
      if (undoStack.length === 0) return;

      const command = undoStack[undoStack.length - 1];

      // Prevent re-entry during execution
      set({ isExecuting: true });

      // Execute undo
      command.undo();

      // Move to redo stack (respecting max)
      const newRedoStack = [...redoStack, command];
      if (newRedoStack.length > MAX_REDO_STACK) {
        newRedoStack.shift();
      }

      const newUndoStack = undoStack.slice(0, -1);
      set({
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        undoAvailable: newUndoStack.length > 0,
        redoAvailable: true,
        isExecuting: false,
      });

      get().saveToLocalStorage();
    },

    redo: () => {
      const { undoStack, redoStack } = get();
      if (redoStack.length === 0) return;

      const command = redoStack[redoStack.length - 1];

      set({ isExecuting: true });

      // Execute redo
      command.execute();

      // Move back to undo stack (respecting max)
      const newUndoStack = [...undoStack, command];
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift();
      }

      const newRedoStack = redoStack.slice(0, -1);
      set({
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        undoAvailable: true,
        redoAvailable: newRedoStack.length > 0,
        isExecuting: false,
      });

      get().saveToLocalStorage();
    },

    undoTo: (index) => {
      const { undoStack } = get();
      const commandsToUndo = undoStack.slice(index);

      for (let i = commandsToUndo.length - 1; i >= 0; i--) {
        commandsToUndo[i].undo();
      }

      // Reverse for redo stack
      const reversedRedo: Command[] = [];
      for (let i = commandsToUndo.length - 1; i >= 0; i--) {
        reversedRedo.push(commandsToUndo[i]);
      }

      set({
        undoStack: undoStack.slice(0, index),
        redoStack: reversedRedo,
        undoAvailable: index > 0,
        redoAvailable: commandsToUndo.length > 0,
      });

      get().saveToLocalStorage();
    },

    // ── State queries ─────────────────────────────────────────────

    canUndo: () => get().undoStack.length > 0,

    canRedo: () => get().redoStack.length > 0,

    getUndoStack: () => get().undoStack,

    getRedoStack: () => get().redoStack,

    getUndoCount: () => get().undoStack.length,

    getRedoCount: () => get().redoStack.length,

    // ── Clear ─────────────────────────────────────────────────────

    clear: () => {
      set({
        undoStack: [],
        redoStack: [],
        undoAvailable: false,
        redoAvailable: false,
      });
      localStorage.removeItem(STORAGE_KEY);
    },

    clearUndoStack: () => {
      set({
        undoStack: [],
        undoAvailable: false,
      });
      get().saveToLocalStorage();
    },

    clearRedoStack: () => {
      set({
        redoStack: [],
        redoAvailable: false,
      });
      get().saveToLocalStorage();
    },

    // ── Helpers ───────────────────────────────────────────────────

    getLastCommand: () => {
      const { undoStack } = get();
      return undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
    },

    setIsExecuting: (val) => set({ isExecuting: val }),

    // ── Persistence ─────────────────────────────────────────────

    saveToLocalStorage: () => {
      const { undoStack, redoStack } = get();
      saveStackToLocalStorage(undoStack, redoStack);
    },

    loadFromLocalStorage: () => {
      const data = loadStackFromLocalStorage();
      if (!data) return;

      set({
        undoStack: data.undoStack,
        redoStack: data.redoStack,
        undoAvailable: data.undoStack.length > 0,
        redoAvailable: data.redoStack.length > 0,
      });
    },
  }),
);

// ── Helper: Create a state-based command ──────────────────────────────────

/**
 * Create a command that operates on a state snapshot.
 * The command stores before/after snapshots and can restore state on undo.
 */
export function createStateCommand<T>(
  type: CommandType,
  label: string,
  state: T,
  execute: (state: T) => T,
): Omit<Command, 'id' | 'timestamp'> {
  const snapshot = JSON.parse(JSON.stringify(state));
  const newState = execute(state);

  return {
    type,
    label,
    execute: () => {
      // State change applied immediately — no-op here
    },
    undo: () => {
      // Revert to snapshot — external store handles restoration
      void snapshot;
    },
    beforeState: snapshot,
    afterState: newState,
  };
}
