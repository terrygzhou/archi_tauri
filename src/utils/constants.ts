import { ArchiMateLayer, LAYER_COLORS, ArchiMateElementType } from '../types/archimate';
import { RelationshipType, ALL_RELATIONSHIP_TYPES } from '../types/relationships';

// ============================================================================
// Application constants
// ============================================================================
export const APP_NAME = 'Archi Desktop';
export const APP_VERSION = '1.0.0';
export const ARCHIMATE_VERSION = '3.1';

// ============================================================================
// Default dimensions
// ============================================================================
export const DEFAULT_ELEMENT_WIDTH = 100;
export const DEFAULT_ELEMENT_HEIGHT = 50;
export const DEFAULT_DIAGRAM_ELEMENT_WIDTH = 100;
export const DEFAULT_DIAGRAM_ELEMENT_HEIGHT = 50;

// ============================================================================
// Grid constants
// ============================================================================
export const DEFAULT_GRID_SIZE = 10;
export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 50;

// ============================================================================
// Canvas constants
// ============================================================================
export const DEFAULT_CANVAS_ZOOM = 1.0;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;

// ============================================================================
// File format constants
// ============================================================================
export const ARCHI_FILE_EXTENSION = '.archi';
export const ARCHI_MIME_TYPE = 'application/x-archimate';

// ============================================================================
// Viewpoint constants
// ============================================================================
export type Viewpoint =
  | 'Business'
  | 'Application'
  | 'Technology'
  | 'Physical'
  | 'Implementation'
  | 'Motivation'
  | 'Strategy'
  | 'Cross-layer'
  | 'Service'
  | 'Process'
  | 'System'
  | 'Gap'
  | 'Capability'
  | 'ValueStream'
  | 'Other';

export const ALL_VIEWPOINTS: readonly Viewpoint[] = [
  'Business', 'Application', 'Technology', 'Physical',
  'Implementation', 'Motivation', 'Strategy', 'Cross-layer',
  'Service', 'Process', 'System', 'Gap', 'Capability',
  'ValueStream', 'Other',
];

// ============================================================================
// Export format constants
// ============================================================================
export type ExportFormat = 'svg' | 'png' | 'pdf';

export const EXPORT_FORMATS: readonly ExportFormat[] = ['svg', 'png', 'pdf'];

// ============================================================================
// Key constants (for keyboard shortcuts)
// ============================================================================
export const KEYBOARD_SHORTCUTS = {
  UNDO: { key: 'z', ctrl: true, shift: false } as const,
  REDO: { key: 'z', ctrl: true, shift: true } as const,
  CUT: { key: 'x', ctrl: true, shift: false } as const,
  COPY: { key: 'c', ctrl: true, shift: false } as const,
  PASTE: { key: 'v', ctrl: true, shift: false } as const,
  DELETE: { key: 'Backspace', ctrl: false, shift: false } as const,
  SELECT_ALL: { key: 'a', ctrl: true, shift: false } as const,
  SAVE: { key: 's', ctrl: true, shift: false } as const,
  OPEN: { key: 'o', ctrl: true, shift: false } as const,
  NEW: { key: 'n', ctrl: true, shift: false } as const,
  FIND: { key: 'f', ctrl: true, shift: false } as const,
  FIND_REPLACE: { key: 'h', ctrl: true, shift: false } as const,
  ZOOM_IN: { key: '=', ctrl: true, shift: false } as const,
  ZOOM_OUT: { key: '-', ctrl: true, shift: false } as const,
  ZOOM_FIT: { key: '0', ctrl: true, shift: false } as const,
  TOGGLE_GRID: { key: 'g', ctrl: false, shift: false } as const,
  FULLSCREEN: { key: 'f11', ctrl: false, shift: false } as const,
  PRINT: { key: 'p', ctrl: true, shift: false } as const,
} as const;

// ============================================================================
// Color palette for elements
// ============================================================================
export const DEFAULT_ELEMENT_COLORS: Readonly<Record<string, string>> = Object.freeze({
  // Strategy
  Capability: '#E8F5E9',
  Resource: '#E8F5E9',
  ValueStream: '#E8F5E9',
  Stakeholder: '#E8F5E9',
  Driver: '#E8F5E9',
  Goal: '#E8F5E9',
  Requirement: '#E8F5E9',
  Constraint: '#E8F5E9',
  Principle: '#E8F5E9',
  Assessment: '#E8F5E9',
  Value: '#E8F5E9',
  Representation: '#E8F5E9',
  CourseOfAction: '#E8F5E9',
  Outcome: '#E8F5E9',
  // Business
  BusinessActor: '#E8F5E9',
  BusinessCollaboration: '#E8F5E9',
  BusinessEvent: '#E8F5E9',
  BusinessFunction: '#E8F5E9',
  BusinessInteraction: '#E8F5E9',
  BusinessInterface: '#E8F5E9',
  BusinessObject: '#E8F5E9',
  BusinessProcess: '#E8F5E9',
  BusinessRole: '#E8F5E9',
  BusinessService: '#E8F5E9',
  Location: '#E8F5E9',
  // Application
  ApplicationCollaboration: '#E3F2FD',
  ApplicationComponent: '#E3F2FD',
  ApplicationEvent: '#E3F2FD',
  ApplicationFunction: '#E3F2FD',
  ApplicationInteraction: '#E3F2FD',
  ApplicationInterface: '#E3F2FD',
  ApplicationProcess: '#E3F2FD',
  ApplicationService: '#E3F2FD',
  // Technology
  TechnologyCollaboration: '#FFF3E0',
  TechnologyComponent: '#FFF3E0',
  TechnologyEvent: '#FFF3E0',
  TechnologyFunction: '#FFF3E0',
  TechnologyInteraction: '#FFF3E0',
  TechnologyInterface: '#FFF3E0',
  TechnologyProcess: '#FFF3E0',
  TechnologyService: '#FFF3E0',
  Node: '#FFF3E0',
  CommunicationNetwork: '#FFF3E0',
  // Physical
  Facility: '#F3E5F5',
  Equipment: '#F3E5F5',
  SystemSoftware: '#F3E5F5',
  CommunicationPath: '#F3E5F5',
  DistributionNetwork: '#F3E5F5',
  Product: '#F3E5F5',
  // Implementation
  WorkPackage: '#FFE0B2',
  Plateau: '#FFE0B2',
  Gap: '#FFE0B2',
  Contract: '#FFE0B2',
  Deliverable: '#FFE0B2',
  ImplementationEvent: '#FFE0B2',
  Meaning: '#FFE0B2',
  // Other
  Grouping: '#F5F5F5',
  Junction: '#F5F5F5',
  DataObject: '#F5F5F5',
  Material: '#F5F5F5',
  Artifact: '#F5F5F5',
  LineConnection: '#F5F5F5',
  Note: '#F5F5F5',
});

// ============================================================================
// Layer to palette color mapping (for diagram elements)
// ============================================================================
export function getLayerFill(layer: ArchiMateLayer): string {
  return LAYER_COLORS[layer];
}

// ============================================================================
// Default folder structure for new models
// ============================================================================
export const DEFAULT_FOLDERS = [
  'Business',
  'Application',
  'Technology',
  'Implementation',
  'Motivation',
  'Other',
] as const;

// ============================================================================
// Pagination constants
// ============================================================================
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

// ============================================================================
// Undo/redo stack limits
// ============================================================================
export const MAX_UNDO_STACK = 100;
export const MAX_REDO_STACK = 100;

// ============================================================================
// Storage keys
// ============================================================================
export const STORAGE_KEYS = {
  LAST_OPENED_FILE: 'archi.lastOpenedFile',
  RECENT_FILES: 'archi.recentFiles',
  WINDOW_STATE: 'archi.windowState',
  PREFERENCES: 'archi.preferences',
  LLM_CONFIG: 'archi.llmConfig',
} as const;

// ============================================================================
// LLM service constants
// ============================================================================
export const LLM_CONFIG_KEY = 'archi.llmConfig';
export const LLM_MAX_TOKENS = 4096;
export const LLM_TEMPERATURE = 0.7;
