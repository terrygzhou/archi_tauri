// ============================================================================
// Diagram Store — canvas state, element positions, selections, exports
// ============================================================================

import { create } from 'zustand';
import { ArchiMateElementType, LAYER_COLORS, ELEMENT_TYPE_TO_LAYER } from '../types/archimate';
import {
  Diagram,
  DiagramElement,
  DiagramConnection,
  ModelFactory,
} from '../types/domain';
import { useModelStore } from './modelStore';

// ── View state ────────────────────────────────────────────────────────────

export interface DiagramViewState {
  x: number;
  y: number;
  zoom: number;
}

// ── Store state ───────────────────────────────────────────────────────────

interface DiagramState {
  // Active diagram
  activeDiagram: Diagram | null;
  diagrams: Diagram[];
  activeDiagramId: string | null;

  // View state
  view: DiagramViewState;

  // Selection
  selectedElementIds: string[];
  selectedConnectionIds: string[];

  // Interaction state
  isDragging: boolean;
  dragElementId: string | null;
  dragOffsetX: number;
  dragOffsetY: number;
  isConnecting: boolean;
  connectSourceElementId: string | null;

  // Grid
  gridSize: number;
  gridVisible: boolean;
  gridSnap: boolean;

  // Connection router
  connectionRouter: 'orthogonal' | 'straight' | 'discrete';

  // Export settings
  exportBackground: string;
  exportScale: number;
}

// ── Store actions ─────────────────────────────────────────────────────────

interface DiagramActions {
  // Diagram management
  loadDiagram: (diagramId: string) => void;
  setActiveDiagram: (diagramId: string) => void;
  addDiagram: (diagram: Diagram) => void;
  saveDiagram: () => Diagram | null;
  updateDiagram: (id: string, updates: Partial<Diagram>) => void;
  deleteDiagram: (id: string) => void;
  getDiagram: (id: string) => Diagram | undefined;

  // Element operations
  addDiagramElement: (
    elementId: string,
    x: number,
    y: number,
    overrides?: Partial<DiagramElement>,
  ) => void;
  updateDiagramElement: (
    elementId: string,
    updates: Partial<DiagramElement>,
  ) => void;
  deleteDiagramElement: (elementId: string) => void;
  moveElement: (elementId: string, x: number, y: number) => void;
  resizeElement: (elementId: string, width: number, height: number) => void;

  // Connection operations
  addDiagramConnection: (
    relationshipId: string,
    sourceElementId: string,
    targetElementId: string,
    overrides?: Partial<DiagramConnection>,
  ) => void;
  deleteDiagramConnection: (connectionId: string) => void;

  // Selection
  selectElement: (elementId: string, multi?: boolean) => void;
  selectConnection: (connectionId: string, multi?: boolean) => void;
  selectMultiple: (elementIds: string[]) => void;
  deselectAll: () => void;
  selectAll: () => void;
  toggleSelection: (elementId: string) => void;

  // View
  setZoom: (level: number) => void;
  setView: (view: Partial<DiagramViewState>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  pan: (dx: number, dy: number) => void;
  resetView: () => void;

  // Grid
  toggleGrid: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;

  // Drag
  startDrag: (elementId: string, offsetX: number, offsetY: number) => void;
  dragMove: (dx: number, dy: number) => void;
  endDrag: () => void;

  // Connection
  startConnect: (elementId: string) => void;
  endConnect: (targetElementId: string) => void;
  cancelConnect: () => void;

  // Element creation from palette
  createAndAddElement: (
    type: ArchiMateElementType,
    x: number,
    y: number,
  ) => void;

  // Export
  exportSVG: () => string;
  exportPNG: (callback: (dataUrl: string) => void, scale?: number) => void;

  // Model sync
  syncWithModel: () => void;

  // Snap to grid
  snapToGrid: (value: number) => number;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────
  activeDiagram: null,
  diagrams: [],
  activeDiagramId: null,
  view: { x: 0, y: 0, zoom: 1 },
  selectedElementIds: [],
  selectedConnectionIds: [],
  isDragging: false,
  dragElementId: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  isConnecting: false,
  connectSourceElementId: null,
  gridSize: 10,
  gridVisible: true,
  gridSnap: true,
  connectionRouter: 'orthogonal',
  exportBackground: '#FFFFFF',
  exportScale: 2,

  // ── Diagram management ──────────────────────────────────────────

  loadDiagram: (diagramId) => {
    const { diagrams } = get();
    const diagram = diagrams.find((d) => d.id === diagramId);
    if (!diagram) return;
    set({
      activeDiagram: diagram,
      activeDiagramId: diagramId,
      selectedElementIds: [],
      selectedConnectionIds: [],
    });
  },

  saveDiagram: () => {
    const { activeDiagram } = get();
    if (!activeDiagram) return null;
    return { ...activeDiagram };
  },

  setActiveDiagram: (diagramId) => {
    const { diagrams } = get();
    const diagram = diagrams.find((d) => d.id === diagramId);
    if (!diagram) return;
    set({
      activeDiagram: diagram,
      activeDiagramId: diagramId,
      selectedElementIds: [],
      selectedConnectionIds: [],
    });
  },

  addDiagram: (diagram) => {
    const { diagrams } = get();
    const newDiagrams = [...diagrams, diagram];
    set({
      diagrams: newDiagrams,
      activeDiagram: diagram,
      activeDiagramId: diagram.id,
    });
  },

  updateDiagram: (id, updates) => {
    const { diagrams, activeDiagram } = get();
    const updated = diagrams.map((d) =>
      d.id === id ? { ...d, ...updates } : d,
    );
    set({
      diagrams: updated,
      ...(activeDiagram?.id === id
        ? { activeDiagram: updated.find((d) => d.id === id) ?? null }
        : {}),
    });
  },

  deleteDiagram: (id) => {
    const { diagrams, activeDiagramId } = get();
    const newDiagrams = diagrams.filter((d) => d.id !== id);
    set({
      diagrams: newDiagrams,
      activeDiagram: newDiagrams.length > 0 ? newDiagrams[0] : null,
      activeDiagramId: newDiagrams.length > 0 ? newDiagrams[0].id : null,
    });
  },

  getDiagram: (id) => {
    const { diagrams } = get();
    return diagrams.find((d) => d.id === id);
  },

  // ── Element operations ──────────────────────────────────────────

  addDiagramElement: (elementId, x, y, overrides = {}) => {
    const { activeDiagram, snapToGrid } = get();
    if (!activeDiagram) return;

    const de = ModelFactory.createDiagramElement(elementId, activeDiagram.id, {
      x: snapToGrid(x),
      y: snapToGrid(y),
      ...overrides,
    });

    const updated = {
      ...activeDiagram,
      elements: [...activeDiagram.elements, de],
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  updateDiagramElement: (elementId, updates) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const updated = {
      ...activeDiagram,
      elements: activeDiagram.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el,
      ),
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  deleteDiagramElement: (elementId) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const updated = {
      ...activeDiagram,
      elements: activeDiagram.elements.filter((el) => el.id !== elementId),
      connections: activeDiagram.connections.filter(
        (c) => c.sourceElementId !== elementId && c.targetElementId !== elementId,
      ),
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
      selectedElementIds: get().selectedElementIds.filter((id) => id !== elementId),
    });
  },

  moveElement: (elementId, x, y) => {
    const { activeDiagram, snapToGrid } = get();
    if (!activeDiagram) return;

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    const updated = {
      ...activeDiagram,
      elements: activeDiagram.elements.map((el) =>
        el.id === elementId ? { ...el, x: snappedX, y: snappedY } : el,
      ),
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  resizeElement: (elementId, width, height) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const updated = {
      ...activeDiagram,
      elements: activeDiagram.elements.map((el) =>
        el.id === elementId ? { ...el, width, height } : el,
      ),
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  // ── Connection operations ───────────────────────────────────────

  addDiagramConnection: (relationshipId, sourceElementId, targetElementId, overrides = {}) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const dc = ModelFactory.createConnection(
      relationshipId,
      activeDiagram.id,
      sourceElementId,
      targetElementId,
      overrides,
    );

    const updated = {
      ...activeDiagram,
      connections: [...activeDiagram.connections, dc],
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  deleteDiagramConnection: (connectionId) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const updated = {
      ...activeDiagram,
      connections: activeDiagram.connections.filter((c) => c.id !== connectionId),
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
      selectedConnectionIds: get().selectedConnectionIds.filter((id) => id !== connectionId),
    });
  },

  // ── Selection ───────────────────────────────────────────────────

  selectElement: (elementId, multi = false) => {
    if (multi) {
      const ids = get().selectedElementIds;
      set({
        selectedElementIds: ids.includes(elementId)
          ? ids.filter((id) => id !== elementId)
          : [...ids, elementId],
      });
    } else {
      set({
        selectedElementIds: [elementId],
        selectedConnectionIds: [],
      });
    }
  },

  selectConnection: (connectionId, multi = false) => {
    if (multi) {
      const ids = get().selectedConnectionIds;
      set({
        selectedConnectionIds: ids.includes(connectionId)
          ? ids.filter((id) => id !== connectionId)
          : [...ids, connectionId],
      });
    } else {
      set({
        selectedElementIds: [],
        selectedConnectionIds: [connectionId],
      });
    }
  },

  selectMultiple: (elementIds) => {
    set({
      selectedElementIds: elementIds,
      selectedConnectionIds: [],
    });
  },

  deselectAll: () => {
    set({
      selectedElementIds: [],
      selectedConnectionIds: [],
    });
  },

  selectAll: () => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;
    set({
      selectedElementIds: activeDiagram.elements.map((el) => el.id),
      selectedConnectionIds: activeDiagram.connections.map((c) => c.id),
    });
  },

  toggleSelection: (elementId) => {
    const { selectedElementIds } = get();
    set({
      selectedElementIds: selectedElementIds.includes(elementId)
        ? selectedElementIds.filter((id) => id !== elementId)
        : [...selectedElementIds, elementId],
    });
  },

  // ── View / Zoom / Pan ──────────────────────────────────────────

  setZoom: (level) => {
    const clamped = Math.max(0.1, Math.min(5, level));
    set({ view: { ...get().view, zoom: clamped } });
  },

  setView: (viewUpdates) => {
    set({ view: { ...get().view, ...viewUpdates } });
  },

  zoomIn: () => {
    set({ view: { ...get().view, zoom: Math.min(get().view.zoom * 1.1, 5) } });
  },

  zoomOut: () => {
    set({ view: { ...get().view, zoom: Math.max(get().view.zoom / 1.1, 0.1) } });
  },

  zoomFit: () => {
    set({ view: { x: 0, y: 0, zoom: 1 } });
  },

  pan: (dx, dy) => {
    set({
      view: {
        ...get().view,
        x: get().view.x + dx,
        y: get().view.y + dy,
      },
    });
  },

  resetView: () => {
    set({ view: { x: 0, y: 0, zoom: 1 } });
  },

  // ── Grid ────────────────────────────────────────────────────────

  toggleGrid: () => {
    set({ gridVisible: !get().gridVisible });
  },

  toggleSnap: () => {
    set({ gridSnap: !get().gridSnap });
  },

  setGridSize: (size) => {
    set({ gridSize: size });
  },

  // ── Drag ───────────────────────────────────────────────────────

  startDrag: (elementId, offsetX, offsetY) => {
    set({
      isDragging: true,
      dragElementId: elementId,
      dragOffsetX: offsetX,
      dragOffsetY: offsetY,
    });
  },

  dragMove: (dx, dy) => {
    const { dragElementId } = get();
    if (!dragElementId) return;
    get().moveElement(dragElementId, dx, dy);
  },

  endDrag: () => {
    set({
      isDragging: false,
      dragElementId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
    });
  },

  // ── Connection ─────────────────────────────────────────────────

  startConnect: (elementId) => {
    set({
      isConnecting: true,
      connectSourceElementId: elementId,
    });
  },

  endConnect: (targetElementId) => {
    const { connectSourceElementId, activeDiagram } = get();
    if (!connectSourceElementId || !activeDiagram) return;

    const dc = ModelFactory.createConnection(
      'auto-' + crypto.randomUUID(),
      activeDiagram.id,
      connectSourceElementId,
      targetElementId,
    );

    const updated = {
      ...activeDiagram,
      connections: [...activeDiagram.connections, dc],
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
      isConnecting: false,
      connectSourceElementId: null,
    });
  },

  cancelConnect: () => {
    set({
      isConnecting: false,
      connectSourceElementId: null,
    });
  },

  // ── Element creation from palette ──────────────────────────────

  createAndAddElement: (type, x, y) => {
    const { activeDiagram } = get();
    if (!activeDiagram) return;

    const layer = ELEMENT_TYPE_TO_LAYER[type];
    const fillColor = LAYER_COLORS[layer];

    const elementId = crypto.randomUUID();
    const de = ModelFactory.createDiagramElement(elementId, activeDiagram.id, {
      x: get().snapToGrid(x),
      y: get().snapToGrid(y),
      customStyle: { fillColor },
    });

    const updated = {
      ...activeDiagram,
      elements: [...activeDiagram.elements, de],
    };

    set({
      activeDiagram: updated,
      diagrams: get().diagrams.map((d) => (d.id === activeDiagram.id ? updated : d)),
    });
  },

  // ── Export ─────────────────────────────────────────────────────

  exportSVG: () => {
    const { activeDiagram } = get();
    if (!activeDiagram) return '';

    // Build SVG string from diagram data
    const elements = activeDiagram.elements;
    const connections = activeDiagram.connections;

    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\n';
    svg += '<rect width="100%" height="100%" fill="' + activeDiagram.backgroundColor + '" />\n';

    // Render connections first (behind elements)
    for (const conn of connections) {
      const source = elements.find((e) => e.id === conn.sourceElementId);
      const target = elements.find((e) => e.id === conn.targetElementId);
      if (!source || !target) continue;

      const sx = source.x + source.width / 2;
      const sy = source.y + source.height / 2;
      const tx = target.x + target.width / 2;
      const ty = target.y + target.height / 2;

      svg += '<line x1="' + sx + '" y1="' + sy + '" x2="' + tx + '" y2="' + ty
        + '" stroke="#333333" stroke-width="1" />\n';
    }

    // Render elements
    for (const el of elements) {
      svg += '<rect x="' + el.x + '" y="' + el.y + '" width="' + el.width
        + '" height="' + el.height + '" fill="' + (el.customStyle['fillColor'] ?? '#cccccc')
        + '" stroke="#333333" stroke-width="1" />\n';
    }

    svg += '</svg>';
    return svg;
  },

  exportPNG: (callback, scale) => {
    const svg = get().exportSVG();
    if (!svg) {
      callback('');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const svgSize = 1000;
      const exportScale = scale ?? get().exportScale ?? 2;
      canvas.width = svgSize * exportScale;
      canvas.height = svgSize * exportScale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback('');
        return;
      }

      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        callback(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        callback('');
      };

      img.src = url;
    } catch {
      callback('');
    }
  },

  // ── Model sync ────────────────────────────────────────────────

  syncWithModel: () => {
    const { diagrams, activeDiagramId } = get();
    const modelStore = useModelStore.getState();

    if (!modelStore.model) return;

    // Sync diagrams with model store
    for (const diagram of diagrams) {
      modelStore.updateElement = modelStore.updateElement;
      // Sync diagram elements with model elements
      for (const de of diagram.elements) {
        const element = modelStore.getElement(de.elementId);
        if (element) {
          // Element exists in model — ensure it's consistent
        }
      }
    }
  },

  // ── Grid helpers ───────────────────────────────────────────────

  snapToGrid: (value) => {
    const { gridSize, gridSnap } = get();
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  },
}));
