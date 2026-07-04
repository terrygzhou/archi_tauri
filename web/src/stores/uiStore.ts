import { create } from 'zustand';

// ============================================================================
// UI state types
// ============================================================================
export type PanelPosition = 'left' | 'right' | 'bottom' | 'hidden';

export interface PanelSize {
  width?: number;
  height?: number;
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  fontFamily: string;
  fontSize: number;
  language: string;
  showToolbar: boolean;
  showStatusbar: boolean;
  showRulers: boolean;
  showBreadcrumbs: boolean;
}

// ============================================================================
// UI store state
// ============================================================================
interface UIState {
  // Panels
  explorerPosition: PanelPosition;
  explorerSize: PanelSize;
  propertiesPosition: PanelPosition;
  propertiesSize: PanelSize;
  palettePosition: PanelPosition;
  paletteSize: PanelSize;

  // Toolbars
  showToolbar: boolean;
  showStatusbar: boolean;
  showRulers: boolean;

  // Active views
  activeTab: 'diagram' | 'properties' | 'explorer' | 'palette';
  activeDiagramTab: string;

  // Notifications
  notifications: NotificationItem[];

  // Modal/dialog state
  activeModal: string | null;
  activeDialog: string | null;

  // Preferences
  preferences: UIPreferences;

  // Loading
  isLoading: boolean;
  progress: number;

  // Keyboard shortcuts active
  keyboardShortcutsEnabled: boolean;

  // Recent files
  recentFiles: RecentFile[];

  // Split pane
  splitPercentage: number;
}

interface UIActions {
  // Panels
  setExplorerPosition: (position: PanelPosition) => void;
  setExplorerSize: (size: PanelSize) => void;
  setPropertiesPosition: (position: PanelPosition) => void;
  setPropertiesSize: (size: PanelSize) => void;
  setPalettePosition: (position: PanelPosition) => void;
  setPaletteSize: (size: PanelSize) => void;

  // Visibility
  toggleToolbar: () => void;
  toggleStatusbar: () => void;
  toggleRulers: () => void;

  // Tabs
  setActiveTab: (tab: UIState['activeTab']) => void;
  setActiveDiagramTab: (tab: string) => void;

  // Notifications
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Modal/Dialog
  openModal: (modal: string) => void;
  closeModal: () => void;
  openDialog: (dialog: string) => void;
  closeDialog: () => void;

  // Preferences
  setPreferences: (prefs: Partial<UIPreferences>) => void;
  resetPreferences: () => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;

  // Keyboard shortcuts
  toggleKeyboardShortcuts: () => void;

  // Recent files
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;

  // Split pane
  setSplitPercentage: (percentage: number) => void;
}

// ============================================================================
// Notification types
// ============================================================================
export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  autoDismiss?: number;
}

// ============================================================================
// Recent file types
// ============================================================================
export interface RecentFile {
  id: string;
  path: string;
  lastOpened: string;
  lastModified: string;
}

// ============================================================================
// Default preferences
// ============================================================================
const DEFAULT_PREFERENCES: UIPreferences = {
  theme: 'system',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  language: 'en',
  showToolbar: true,
  showStatusbar: true,
  showRulers: true,
  showBreadcrumbs: true,
};

// ============================================================================
// UI store
// ============================================================================
export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // Initial state
  explorerPosition: 'left',
  explorerSize: { width: 250 },
  propertiesPosition: 'right',
  propertiesSize: { width: 300 },
  palettePosition: 'hidden',
  paletteSize: { width: 220 },

  showToolbar: true,
  showStatusbar: true,
  showRulers: true,

  activeTab: 'diagram',
  activeDiagramTab: '',

  notifications: [],

  activeModal: null,
  activeDialog: null,

  preferences: DEFAULT_PREFERENCES,

  isLoading: false,
  progress: 0,

  keyboardShortcutsEnabled: true,

  recentFiles: [],

  splitPercentage: 30,

  // Panels
  setExplorerPosition: (position) => set({ explorerPosition: position }),
  setExplorerSize: (size) => set({ explorerSize: size }),
  setPropertiesPosition: (position) => set({ propertiesPosition: position }),
  setPropertiesSize: (size) => set({ propertiesSize: size }),
  setPalettePosition: (position) => set({ palettePosition: position }),
  setPaletteSize: (size) => set({ paletteSize: size }),

  // Visibility
  toggleToolbar: () => set({ showToolbar: !get().showToolbar }),
  toggleStatusbar: () => set({ showStatusbar: !get().showStatusbar }),
  toggleRulers: () => set({ showRulers: !get().showRulers }),

  // Tabs
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveDiagramTab: (tab) => set({ activeDiagramTab: tab }),

  // Notifications
  addNotification: (notification) => {
    const n: NotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    set({
      notifications: [...get().notifications, n],
    });

    // Auto-dismiss if configured
    if (notification.autoDismiss) {
      setTimeout(() => get().dismissNotification(n.id), notification.autoDismiss);
    }
  },

  dismissNotification: (id) => {
    set({
      notifications: get().notifications.filter(n => n.id !== id),
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Modal/Dialog
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  openDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: null }),

  // Preferences
  setPreferences: (prefs) => {
    set({
      preferences: { ...get().preferences, ...prefs },
    });
  },

  resetPreferences: () => {
    set({ preferences: DEFAULT_PREFERENCES });
  },

  // Loading
  setLoading: (loading) => set({ isLoading: loading }),
  setProgress: (progress) => set({ progress }),

  // Keyboard shortcuts
  toggleKeyboardShortcuts: () => {
    set({ keyboardShortcutsEnabled: !get().keyboardShortcutsEnabled });
  },

  // Recent files
  addRecentFile: (file) => {
    const files = get().recentFiles.filter(f => f.path !== file.path);
    set({
      recentFiles: [file, ...files].slice(0, 10),
    });
  },

  clearRecentFiles: () => {
    set({ recentFiles: [] });
  },

  // Split pane
  setSplitPercentage: (percentage) => {
    set({ splitPercentage: Math.max(10, Math.min(90, percentage)) });
  },
}));
