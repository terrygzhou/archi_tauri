import { create } from 'zustand';
import {
  ArchiMateElement,
  Model,
  Relationship,
  Folder,
  ModelFactory,
} from '../types/domain';
import { ArchiMateElementType } from '../types/archimate';

// ============================================================================
// Model store state
// ============================================================================
interface ModelState {
  model: Model | null;
  isOpen: boolean;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ModelActions {
  // Model lifecycle
  createModel: (name?: string) => void;
  clearModel: () => void;

  // Elements
  addElement: (type: ArchiMateElementType, overrides?: Partial<ArchiMateElement>) => string;
  updateElement: (id: string, updates: Partial<ArchiMateElement>) => void;
  deleteElement: (id: string) => void;
  getElement: (id: string) => ArchiMateElement | undefined;
  getElements: (type?: ArchiMateElementType) => ArchiMateElement[];
  searchElements: (query: string) => ArchiMateElement[];

  // Relationships
  addRelationship: (relationship: Relationship) => void;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;

  // Folders
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  // Utility
  markDirty: () => void;
  markClean: () => void;
  setLoaded: () => void;
  setUnloaded: () => void;
  setError: (error: string | null) => void;

  // Import/Export
  setModel: (model: Model) => void;
  exportModel: () => Model;
}

// ============================================================================
// Model store
// ============================================================================
export const useModelStore = create<ModelState & ModelActions>((set, get) => ({
  // Initial state
  model: null,
  isOpen: false,
  isDirty: false,
  isLoading: false,
  error: null,

  // Model lifecycle
  createModel: (name = 'Untitled Model') => {
    const model = ModelFactory.createModel({ name });
    set({ model, isOpen: true, isDirty: false, error: null });
  },

  clearModel: () => {
    set({ model: null, isOpen: false, isDirty: false });
  },

  // Elements
  addElement: (type, overrides) => {
    const { model, markDirty } = get();
    if (!model) return '';

    const element = ModelFactory.createElement(type, overrides);
    const newModel = {
      ...model,
      elements: [...model.elements, element],
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
    return element.id;
  },

  updateElement: (id, updates) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      elements: model.elements.map(el =>
        el.id === id ? { ...el, ...updates, modified: new Date().toISOString() } : el
      ),
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  deleteElement: (id) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      elements: model.elements.filter(el => el.id !== id),
      relationships: model.relationships.filter(
        rel => rel.sourceId !== id && rel.targetId !== id
      ),
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  getElement: (id) => {
    const { model } = get();
    if (!model) return undefined;
    return model.elements.find(el => el.id === id);
  },

  getElements: (type) => {
    const { model } = get();
    if (!model) return [];
    if (!type) return [...model.elements];
    return model.elements.filter(el => el.type === type);
  },

  searchElements: (query) => {
    const { model } = get();
    if (!model) return [];
    const lower = query.toLowerCase();
    return model.elements.filter(el =>
      (el.name.toLowerCase().includes(lower) ||
        el.tags.some(t => t.toLowerCase().includes(lower)) ||
        (el.documentation?.toLowerCase().includes(lower) ?? false))
    );
  },

  // Relationships
  addRelationship: (relationship) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      relationships: [...model.relationships, relationship],
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  updateRelationship: (id, updates) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      relationships: model.relationships.map(rel =>
        rel.id === id ? { ...rel, ...updates } : rel
      ),
    };

    set({ model: newModel });
    markDirty();
  },

  deleteRelationship: (id) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      relationships: model.relationships.filter(rel => rel.id !== id),
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  // Folders
  addFolder: (folder) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      folders: [...model.folders, folder],
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  updateFolder: (id, updates) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      folders: model.folders.map(f => (f.id === id ? { ...f, ...updates } : f)),
    };

    set({ model: newModel });
    markDirty();
  },

  deleteFolder: (id) => {
    const { model, markDirty } = get();
    if (!model) return;

    const newModel = {
      ...model,
      folders: model.folders.filter(f => f.id !== id),
      modified: new Date().toISOString(),
    };

    set({ model: newModel });
    markDirty();
  },

  // Utility
  markDirty: () => {
    set({ isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  setLoaded: () => {
    set({ isLoading: false });
  },

  setUnloaded: () => {
    set({ isLoading: true });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  // Import/Export
  setModel: (model) => {
    set({ model, isOpen: true, isDirty: false, error: null });
  },

  exportModel: () => {
    const { model } = get();
    if (!model) throw new Error('No model loaded');
    return { ...model };
  },
}));
