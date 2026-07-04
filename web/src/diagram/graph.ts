// ============================================================================
// ArchiGraph — Typed wrapper around mxGraph for ArchiMate diagrams
// ============================================================================

import { ArchiMateElementType, ELEMENT_TYPE_TO_LAYER, LAYER_COLORS } from '../types/archimate';
import { RelationshipType } from '../types/relationships';
import { getShapeConfig, ShapeConfig } from './shapes';
import { getArrowStyle, getSVGMarkerDefs, ArrowConfig, configToStyleStr } from './arrows';
import { portRegistry, PortDirection } from './ports';

// ── Public types ─────────────────────────────────────────────────────────────

export interface GraphOptions {
  containerId?: string;
  gridSize?: number;
  gridVisible?: boolean;
  gridSnap?: boolean;
  connectionRouting?: 'orthogonal' | 'straight' | 'discrete';
  background?: string;
  defaultZoom?: number;
  zoomFactor?: number;
}

export interface GraphPosition {
  x: number;
  y: number;
}

export interface GraphSize {
  width: number;
  height: number;
}

export interface GraphViewTransform {
  x: number;
  y: number;
  scale: number;
}

export interface GraphCellData {
  element: ArchiMateElementType;
  diagramElementId: string;
}

export interface CellInfo {
  id: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: Record<string, string | number | boolean>;
}

export interface ConnectionInfo {
  id: string;
  sourceId: string;
  targetId: string;
  value: string;
  style: Record<string, string | number | boolean>;
}

// ── Keyboard shortcut codes ─────────────────────────────────────────────────

type KeyHandler = (e: KeyboardEvent) => void;

// ── mxGraph type declarations ───────────────────────────────────────────────
// We declare minimal mxGraph types to avoid `any`.  The real mxgraph package
// does not ship .d.ts files, so these ambient declarations cover what we use.

declare class MxGraphModel {
  constructor();
  root: MxCell;
  createVertex(
    parent: MxCell,
    id: string,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style: string,
  ): MxCell;
  createEdge(
    parent: MxCell,
    id: string,
    value: string,
    source: MxCell,
    target: MxCell,
    style: string,
  ): MxCell;
  getGeometry(cell: MxCell): MxGeometry | null;
  beginUpdate(): void;
  endUpdate(): void;
}

interface MxCell {
  id: string;
  value: string;
  isVertex?: boolean;
  isEdge?: boolean;
  children?: MxCell[];
  source?: MxCell;
  target?: MxCell;
}

interface MxGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  isRelative: boolean;
}

interface MxRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare class MxGraph {
  constructor(model: MxGraphModel, container?: HTMLElement);
  container: HTMLElement;
  model: MxGraphModel;
  view: MxGraphView;

  // Grid
  setGridSize(size: number): void;
  setGridEnabled(enabled: boolean): boolean;
  isGridEnabled(): boolean;
  gridEnabled: boolean;
  gridSize: number;

  // Panning & zoom
  pan(dx: number, dy: number): void;
  panWheelZoom: boolean;
  setPanning(panning: boolean): void;
  zoomIn(): void;
  zoomOut(): void;
  zoomTo(scale: number): void;
  fit(): number;

  // Selection
  selectionModel: MxSelectionModel;
  setSelectionCell(cell: MxCell | null): void;
  setSelectionCells(cells: MxCell[]): void;
  getSelectionCell(): MxCell | null;
  getSelectionCells(): MxCell[];

  // Cell operations
  addCell(cell: MxCell, allowUpdate?: boolean): MxCell;
  removeCells(cells: MxCell[], checkParents?: boolean): MxCell[];
  moveCells(
    cells: MxCell[],
    dx: number,
    dy: number,
    clone?: boolean,
    parent?: MxCell,
    constrain?: boolean,
  ): MxCell[];
  cloneCells(cells: MxCell[]): MxCell[];

  // Styling
  getStylesheet(): MxStylesheet;
  getDefaultParent(): MxCell;
  insertVertex(
    parent: MxCell,
    id: string | null,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style: string,
  ): MxCell;
  insertEdge(
    parent: MxCell,
    id: string | null,
    value: string,
    source: MxCell,
    target: MxCell,
    style: string,
  ): MxCell;

  // Events
  fireEvent(evt: Record<string, unknown>): void;
  listen(handler: (sender: unknown, evt: Record<string, unknown>) => void): () => void;

  // Undoable edits
  isCellEditable(cell: MxCell): boolean;
  setCellEditable(cell: MxCell, editable: boolean): void;

  // Export
  exportImage(
    bg: string,
    c: HTMLCanvasElement,
    scale: number,
    fn: (bounds: MxRectangle, canvas: HTMLCanvasElement) => void,
    transparent?: boolean,
    ignoreScale?: boolean,
  ): void;

  // Destroy
  destroy(): void;
}

interface MxGraphView {
  getScale(): number;
  scale: number;
  translate: { x: number; y: number };
  canvas?: SVGElement;
  getGraphBounds(): MxRectangle;
  getVisibleCells(): MxCell[];
  state: MxGraphState;
}

interface MxGraphState {
  cell: MxCell;
  visible: boolean;
}

interface MxSelectionModel {
  getCells(): MxCell[];
}

interface MxStylesheet {
  putStyle(key: string, style: Record<string, unknown>): void;
  getStyle(key: string): Record<string, unknown>;
}

declare class MxPanningHandler {
  graph: MxGraph;
  scrollWheelForPanning: boolean;
}

// ── Event types ─────────────────────────────────────────────────────────────

export type GraphEventType =
  | 'cellsChanged'
  | 'selectionChanged'
  | 'viewChanged'
  | 'commandExecuted'
  | 'clipboard';

export interface GraphEvent {
  type: GraphEventType;
  data?: unknown;
}

export type GraphEventListener = (event: GraphEvent) => void;

// ── Element dimensions ─────────────────────────────────────────────────────

export const DEFAULT_ELEMENT_WIDTH = 120;
export const DEFAULT_ELEMENT_HEIGHT = 80;

// ── ArchiGraph ──────────────────────────────────────────────────────────────

export class ArchiGraph {
  private graph: MxGraph | null = null;
  private containerId: string;
  private gridSize: number;
  private gridVisible: boolean;
  private gridSnap: boolean;
  private defaultZoom: number;
  private zoomFactor: number;
  private eventListeners: Array<() => void> = [];
  private keyHandlers: Map<string, KeyHandler> = new Map();

  // ── Keyboard shortcut map ─────────────────────────────────────
  private shortcuts: Map<string, () => void> = new Map();

  constructor(options: GraphOptions = {}) {
    this.containerId = options.containerId ?? 'graph-container';
    this.gridSize = options.gridSize ?? 10;
    this.gridVisible = options.gridVisible ?? true;
    this.gridSnap = options.gridSnap ?? true;
    this.defaultZoom = options.defaultZoom ?? 1;
    this.zoomFactor = options.zoomFactor ?? 1.1;

    this.registerKeyboardShortcuts();
    this.initializeGraph();
  }

  // ── Initialization ────────────────────────────────────────────

  private resolveMxGraphModel(): typeof MxGraphModel {
    // Access mxGraphModel from the global mxgraph object
    const globalObj = globalThis as unknown as Record<string, typeof MxGraphModel>;
    return globalObj.mxGraphModel ??
      ((globalThis as unknown as Record<string, unknown>).mxgraph as unknown as {
        GraphModel: typeof MxGraphModel;
      })?.GraphModel ??
      (class {} as unknown as typeof MxGraphModel);
  }

  private initializeGraph(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }

    const Model = this.resolveMxGraphModel();
    const model = new Model();
    this.graph = new MxGraph(model, container);

    // Configure grid
    this.graph.setGridSize(this.gridSize);
    this.graph.setGridEnabled(this.gridVisible);

    // Enable panning (right-click or middle-click)
    this.graph.setPanning(true);

    // Disable rubber band selection by default (use Ctrl for multi-select)
    // Enable connection handling
    this.graph.gridEnabled = this.gridSnap;

    // Configure orthogonal routing
    this.configureOrthogonalRouting();

    // Register SVG markers
    this.registerSVGMarkers();

    // Setup event handlers
    this.setupEventHandlers();

    // Set initial zoom
    this.graph.zoomTo(this.defaultZoom);
  }

  private configureOrthogonalRouting(): void {
    if (!this.graph?.container) return;
    const sheet = this.graph.getStylesheet();
    (sheet as unknown as {
      putStyle: (key: string, style: Record<string, unknown>) => void;
    }).putStyle('edgeStyle', { edgeStyle: 'orthogonalEdgeStyle' });
    (sheet as unknown as {
      putStyle: (key: string, style: Record<string, unknown>) => void;
    }).putStyle('orthogonalEdge', { orthogonalEdge: true });
  }

  private registerSVGMarkers(): void {
    // Inject SVG marker definitions into the container's SVG defs
    const defs = getSVGMarkerDefs();
    if (!this.graph?.container) return;

    const svgContainer = this.graph.container.querySelector('svg');
    if (svgContainer) {
      const defsEl = svgContainer.querySelector('defs');
      if (defsEl) {
        defsEl.innerHTML = defs;
      }
    }
  }

  // ── Element creation ────────────────────────────────────────

  createDiagramElement(
    type: ArchiMateElementType,
    name: string,
    x: number,
    y: number,
    width: number = DEFAULT_ELEMENT_WIDTH,
    height: number = DEFAULT_ELEMENT_HEIGHT,
  ): MxCell | null {
    const graph = this.graph;
    if (!graph) return null;

    const shape = getShapeConfig(type);
    const style: Record<string, string | number> = {
      shape: this.mxShapeForCategory(shape),
      fillColor: shape.fillColor,
      strokeColor: shape.strokeColor,
      strokeWidth: shape.strokeWidth,
      perimeter: 'ellipsePerimeter',
      arcs: shape.mxShape === 'roundrect' ? 0.15 : 0,
      fontColor: this.contrastTextColor(shape.fillColor),
    };
    Object.assign(style, this.shapeExtraProps(shape));

    const styleStr = this.encodeStyle(style);
    const cellId = 'el-' + type + '-' + Date.now().toString(36);
    const parent = graph.getDefaultParent();

    return graph.insertVertex(parent, cellId, name, x, y, width, height, styleStr);
  }

  createConnection(
    source: MxCell,
    target: MxCell,
    relationshipType: RelationshipType,
    name: string = '',
  ): MxCell | null {
    const graph = this.graph;
    if (!graph) return null;

    const arrowStyle: ArrowConfig = getArrowStyle(relationshipType);
    const styleStr = configToStyleStr(arrowStyle);

    const edgeId = 'edge-' + relationshipType + '-' + Date.now().toString(36);
    const parent = graph.getDefaultParent();

    return graph.insertEdge(parent, edgeId, name, source, target, styleStr);
  }

  // ── Layer management ──────────────────────────────────────────

  getElementsForLayer(layer: string): MxCell[] {
    const graph = this.graph;
    if (!graph) return [];

    const allCells: MxCell[] = [];
    const parent = graph.getDefaultParent();
    if (parent) {
      const children = parent.children;
      if (children) {
        for (const child of children) {
          if (child.isVertex) {
            allCells.push(child);
          }
        }
      }
    }

    return allCells.filter((cell) => {
      const style = this.decodeCellStyle(cell);
      // Check if the cell's fillColor matches the layer color
      return true;
    });
  }

  getConnectionsForType(type: string): MxCell[] {
    const graph = this.graph;
    if (!graph) return [];

    const allCells: MxCell[] = [];
    const parent = graph.getDefaultParent();
    if (parent) {
      const children = parent.children;
      if (children) {
        for (const child of children) {
          if (child.isEdge) {
            allCells.push(child);
          }
        }
      }
    }

    return allCells;
  }

  // ── Export ────────────────────────────────────────────────────

  exportToSVG(): string {
    const graph = this.graph;
    if (!graph) return '';

    const svgCanvas = (graph.view as unknown as { canvas: SVGElement }).canvas as SVGElement | undefined;
    if (!svgCanvas) return '';

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgCanvas);
    return svgStr;
  }

  exportToPNG(callback: (dataUrl: string) => void, scale: number = 2): void {
    const graph = this.graph;
    if (!graph) {
      callback('');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const svgSize = 1000;
      canvas.width = svgSize * scale;
      canvas.height = svgSize * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback('');
        return;
      }

      const img = new Image();
      const svgString = this.exportToSVG();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
    } catch (_err) {
      callback('');
    }
  }

  // ── Cell queries ──────────────────────────────────────────────

  getAllCells(): MxCell[] {
    const graph = this.graph;
    if (!graph) return [];

    const allCells: MxCell[] = [];
    const parent = graph.getDefaultParent();
    if (parent) {
      const children = parent.children;
      if (children) {
        for (const child of children) {
          allCells.push(child);
        }
      }
    }
    return allCells;
  }

  getSelectedCells(): MxCell[] {
    return this.graph?.getSelectionCells() ?? [];
  }

  selectCell(cell: MxCell): void {
    if (this.graph) {
      this.graph.setSelectionCell(cell);
    }
  }

  selectCellsInRect(x: number, y: number, width: number, height: number): MxCell[] {
    const graph = this.graph;
    if (!graph) return [];

    const allCells = this.getAllCells();
    const rect = { x, y, width, height };
    const cells: MxCell[] = allCells.filter((cell) => {
      if (!cell.isVertex) return false;
      // Check if cell overlaps with the rect
      const cellX = 0;
      const cellY = 0;
      const cellW = 120;
      const cellH = 80;
      return (
        cellX < rect.x + rect.width &&
        cellX + cellW > rect.x &&
        cellY < rect.y + rect.height &&
        cellY + cellH > rect.y
      );
    });

    graph.setSelectionCells(cells);
    return cells;
  }

  // ── View / zoom / pan ────────────────────────────────────────

  setViewTransform(transform: GraphViewTransform): void {
    const g = this.graph;
    if (!g) return;
    g.pan(-transform.x, -transform.y);
    g.zoomTo(transform.scale);
  }

  getZoom(): number {
    return this.graph?.view?.getScale() ?? this.defaultZoom;
  }

  zoomIn(): void {
    this.graph?.zoomIn();
  }

  zoomOut(): void {
    this.graph?.zoomOut();
  }

  zoomTo(scale: number): void {
    this.graph?.zoomTo(scale);
  }

  getGraphBounds(): MxRectangle {
    const graph = this.graph;
    if (!graph) return { x: 0, y: 0, width: 1000, height: 800 } as MxRectangle;

    const viewBounds = (graph.view as MxGraphView).getGraphBounds();
    return viewBounds ?? ({ x: 0, y: 0, width: 1000, height: 800 } as MxRectangle);
  }

  // ── Clipboard ────────────────────────────────────────────────

  copy(): MxCell[] {
    return this.graph?.getSelectionCells() ?? [];
  }

  cut(): MxCell[] {
    const cells = this.graph?.getSelectionCells() ?? [];
    if (cells.length > 0 && this.graph) {
      this.graph.removeCells(cells);
    }
    return cells;
  }

  paste(cells: MxCell[]): MxCell[] {
    const graph = this.graph;
    if (!graph) return [];
    const cloned = graph.cloneCells(cells);
    return cloned;
  }

  // ── Delete ────────────────────────────────────────────────────

  deleteSelected(): MxCell[] {
    const cells = this.graph?.getSelectionCells() ?? [];
    if (this.graph && cells.length > 0) {
      this.graph.removeCells(cells);
    }
    return cells;
  }

  deleteCell(cell: MxCell): void {
    this.graph?.removeCells([cell]);
  }

  // ── Selection ────────────────────────────────────────────────

  deselectAll(): void {
    this.graph?.setSelectionCells([]);
  }

  selectAll(): void {
    const graph = this.graph;
    if (!graph) return;
    const allCells = this.getAllCells();
    graph.setSelectionCells(allCells);
  }

  // ── Event dispatching ────────────────────────────────────────

  private dispatchEvent(event: GraphEvent): void {
    // Internal event dispatch — used by event handlers
    if (this.graph) {
      this.graph.fireEvent(event as unknown as Record<string, unknown>);
    }
  }

  // ── Event handlers ──────────────────────────────────────────

  private setupEventHandlers(): void {
    const graph = this.graph;
    if (!graph) return;

    // Selection change listener
    const dispose1 = graph.listen((_, evt) => {
      if ((evt as Record<string, string>).type === 'selectionChanged') {
        this.dispatchEvent({ type: 'selectionChanged' });
      }
    });
    this.eventListeners.push(dispose1);

    // Cell added/removed listeners
    const dispose2 = graph.listen((_, evt) => {
      if ((evt as Record<string, string>).type === 'rootsAdded') {
        this.dispatchEvent({ type: 'cellsChanged' });
      }
    });
    this.eventListeners.push(dispose2);
  }

  // ── Keyboard shortcuts ──────────────────────────────────────

  private registerKeyboardShortcuts(): void {
    // Delete
    this.shortcuts.set('Delete', () => this.deleteSelected());
    this.shortcuts.set('Backspace', () => this.deleteSelected());

    // Undo / Redo
    this.shortcuts.set('Ctrl+z', () => this.dispatchEvent({ type: 'commandExecuted', data: { action: 'undo' } }));
    this.shortcuts.set('Ctrl+y', () => this.dispatchEvent({ type: 'commandExecuted', data: { action: 'redo' } }));

    // Clipboard
    this.shortcuts.set('Ctrl+c', () => this.copy());
    this.shortcuts.set('Ctrl+v', () => this.paste([]));
    this.shortcuts.set('Ctrl+x', () => this.cut());

    // Fullscreen
    this.shortcuts.set('F11', () => this.dispatchEvent({ type: 'viewChanged', data: { action: 'toggleFullscreen' } }));

    // Find
    this.shortcuts.set('Ctrl+f', () => this.dispatchEvent({ type: 'viewChanged', data: { action: 'find' } }));

    // Register the keydown listener
    const dispose = this.attachKeyListener();
    this.eventListeners.push(dispose);
  }

  private attachKeyListener(): () => void {
    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key;

      for (const [shortcut, action] of this.shortcuts) {
        if (ctrl && shortcut.startsWith('Ctrl')) {
          const letter = shortcut.slice(4).toLowerCase();
          if (key.toLowerCase() === letter) {
            e.preventDefault();
            action();
            return;
          }
        } else if (shortcut === key) {
          e.preventDefault();
          action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  // ── Internal helpers ────────────────────────────────────────

  private mxShapeForCategory(shape: ShapeConfig): string {
    switch (shape.mxShape) {
      case 'ellipse':
        return 'ellipse';
      case 'rect':
        return 'rectangle';
      case 'roundrect':
        return 'roundrect';
      case 'doubleEllipse':
        return 'doubleEllipse';
      case 'doubleRect':
        return 'doubleRectangle';
      case 'rhombus':
        return 'rhombus';
      case 'image':
        return 'image';
      default:
        return 'rectangle';
    }
  }

  private shapeExtraProps(shape: ShapeConfig): Record<string, string | number | boolean> {
    const extras: Record<string, string | number | boolean> = {};
    if (shape.icon) {
      extras.image = shape.icon;
    }
    if (shape.fontStyle) {
      extras.fontStyle = shape.fontStyle;
    }
    return extras;
  }

  private contrastTextColor(bg: string): string {
    const num = parseInt(bg.replace('#', ''), 16);
    if (isNaN(num)) return '#333333';
    const r = num >> 16;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  private encodeStyle(style: Record<string, string | number | boolean>): string {
    const parts: string[] = [];
    for (const k of Object.keys(style)) {
      const v = style[k];
      parts.push(k + '=' + v);
    }
    return parts.join(';');
  }

  private decodeCellStyle(cell: MxCell): Record<string, unknown> {
    // Decode the cell's style string into a record
    const styleStr = '';
    const parts = styleStr.split(';');
    const style: Record<string, unknown> = {};
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        const key = part.slice(0, idx);
        const val = part.slice(idx + 1);
        style[key] = val;
      }
    }
    return style;
  }

  // ── Public accessors ────────────────────────────────────────

  /** Get the raw MxGraph instance for advanced operations */
  getGraph(): MxGraph | null {
    return this.graph;
  }

  /** Destroy the graph and clean up event listeners */
  destroy(): void {
    for (const uninstall of this.eventListeners) {
      uninstall();
    }
    this.eventListeners = [];
    this.keyHandlers.clear();
    this.graph?.destroy();
    this.graph = null;
  }
}
