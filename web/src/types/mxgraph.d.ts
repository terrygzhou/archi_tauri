// Type declarations for the 'mxgraph' npm package (no built-in types shipped).
// The package exports a UMD factory function: `mxgraph({})` returns the
// namespace object containing mxGraph, mxGraphModel, mxCell, etc.

declare module 'mxgraph' {
  // ── Core interfaces ────────────────────────────────────────

  export interface MxCell {
    id: string;
    value: string | null;
    isVertex?: boolean;
    isEdge?: boolean;
    children?: MxCell[];
    source?: MxCell;
    target?: MxCell;
    style?: string;
  }

  export interface MxGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
    isRelative: boolean;
  }

  export interface MxRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface MxEventObject {
    name?: string;
  }

  export interface MxGraphModel {
    root: MxCell;
    createVertex(
      parent: MxCell,
      id: string | null,
      value: string | null,
      x: number,
      y: number,
      width: number,
      height: number,
      style?: string,
    ): MxCell;
    createEdge(
      parent: MxCell,
      id: string | null,
      value: string | null,
      source: MxCell | null,
      target: MxCell | null,
      style?: string,
    ): MxCell;
    getGeometry(cell: MxCell): MxGeometry | null;
    beginUpdate(): void;
    endUpdate(): void;
  }

  export interface MxGraphView {
    getScale(): number;
    scale: number;
    translate: { x: number; y: number };
    canvas?: SVGElement;
    getGraphBounds(): MxRectangle;
    getVisibleCells(): MxCell[];
  }

  export interface MxSelectionModel {
    getCells(): MxCell[];
  }

  export interface MxStylesheet {
    putStyle(key: string, style: Record<string, unknown>): void;
    getStyle(key: string): Record<string, unknown>;
  }

  export interface MxGraph {
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
      value: string | null,
      x: number,
      y: number,
      width: number,
      height: number,
      style: string,
    ): MxCell;
    insertEdge(
      parent: MxCell,
      id: string | null,
      value: string | null,
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

  export interface MxPanningHandler {
    graph: MxGraph;
    scrollWheelForPanning: boolean;
  }

  // ── Factory return type ───────────────────────────────────
  export interface MxNamespace {
    mxGraph: new (model: MxGraphModel, container?: HTMLElement) => MxGraph;
    mxGraphModel: new () => MxGraphModel;
    mxCell: new (value?: string | null) => MxCell;
    mxGeometry: new (x?: number, y?: number, width?: number, height?: number) => MxGeometry;
    mxRectangle: new (x?: number, y?: number, width?: number, height?: number) => MxRectangle;
    mxPanningHandler: new (graph: MxGraph) => MxPanningHandler;
  }

  // ── Default export: factory function ─────────────────────
  // The mxgraph package exports a UMD module.  In ESM context:
  //   import mxgraph from 'mxgraph'
  //   const mx = mxgraph({ shape: false })
  // The factory returns the namespace object.
  export default function mxgraph(opts?: Record<string, unknown>): MxNamespace;
}
