import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDiagramStore, DiagramViewState } from '../../stores/diagramStore';
import { ArchiGraph, GraphViewTransform } from '../../diagram/graph';
import { useModelStore } from '../../stores/modelStore';
import { ArchiMateElementType } from '../../types/archimate';
import { CanvasContextMenu } from '../contextmenu/CanvasContextMenu';
import { ElementContextMenu } from '../contextmenu/ElementContextMenu';
import './DiagramCanvas.css';

// ============================================================================
// Diagram canvas component — renders the diagram canvas with drag-drop,
// context menus, and pan/zoom.
// ============================================================================

export interface DiagramCanvasProps {
  className?: string;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ArchiGraph | null>(null);

  const {
    activeDiagram,
    view,
    selectedElementIds,
    gridSize,
    gridVisible,
    gridSnap,
    isConnecting,
    isDragging,
    addDiagramElement,
    selectElement,
    deselectAll,
    setView,
    snapToGrid,
  } = useDiagramStore();

  // ── Context Menu State ─────────────────────────────────────────

  const [canvasCtxMenu, setCanvasCtxMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [elementCtxMenu, setElementCtxMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
    elementType?: ArchiMateElementType;
  } | null>(null);

  // ── Initialize graph ────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current) return;

    graphRef.current = new ArchiGraph({
      containerId: 'graph-canvas',
      gridSize,
      gridVisible,
      gridSnap,
    });

    return () => {
      graphRef.current?.destroy();
    };
  }, []);

  // ── Update grid settings ───────────────────────────────────────

  useEffect(() => {
    graphRef.current?.getGraph()?.setGridEnabled(gridVisible);
    graphRef.current?.getGraph()?.setGridSize(gridSize);
  }, [gridVisible, gridSize]);

  // ── Apply view transform ──────────────────────────────────────

  useEffect(() => {
    graphRef.current?.setViewTransform({
      x: -view.x,
      y: -view.y,
      scale: view.zoom,
    });
  }, [view.x, view.y, view.zoom]);

  // ── Mouse handlers ──────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Close any open context menu
      setCanvasCtxMenu(null);
      setElementCtxMenu(null);

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle mouse or Alt+click = pan
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;

        const onMove = (moveEvent: MouseEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          setView({ x: view.x - dx, y: view.y - dy });
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      }
    },
    [view, setView],
  );

  const handleMouseUp = useCallback(() => {
    useDiagramStore.getState().endDrag();
  }, []);

  // ── Context menu (right-click) ─────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setCanvasCtxMenu(null);
      setElementCtxMenu(null);

      const target = e.target as HTMLElement;

      // Check if clicked on an element
      const elementEl = target.closest('[data-element-id]');
      if (elementEl) {
        const elementId = elementEl.getAttribute('data-element-id');
        const elementType = elementEl.getAttribute('data-element-type') as
          | ArchiMateElementType
          | null;
        if (elementId) {
          setElementCtxMenu({
            x: e.clientX,
            y: e.clientY,
            elementId,
            elementType: elementType ?? undefined,
          });
          return;
        }
      }

      // Empty canvas context menu
      setCanvasCtxMenu({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  // ── Double click to rename ─────────────────────────────────────

  const handleDoubleClick = useCallback(() => {
    // TODO: Open rename dialog
  }, []);

  // ── Drag and Drop from Palette ─────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const type = e.dataTransfer.getData('application/archimate');
      if (!type) return;

      // Calculate canvas-relative position
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - view.x) / view.zoom;
      const canvasY = (e.clientY - rect.top - view.y) / view.zoom;

      // Snap to grid
      const snappedX = snapToGrid(canvasX);
      const snappedY = snapToGrid(canvasY);

      // Create element at drop position
      addDiagramElement(crypto.randomUUID(), snappedX, snappedY, {
        elementId: type,
      });

      // Close context menus
      setCanvasCtxMenu(null);
      setElementCtxMenu(null);
    },
    [view, snapToGrid, addDiagramElement],
  );

  const handleDragLeave = useCallback(() => {
    // Could add visual feedback removal here
  }, []);

  // ── Click to select/deselect ──────────────────────────────────

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const elementEl = target.closest('[data-element-id]');

      if (elementEl) {
        const elementId = elementEl.getAttribute('data-element-id');
        if (elementId) {
          selectElement(elementId, e.ctrlKey || e.metaKey);
        }
      } else if (target === canvasRef.current || target.closest('.diagram-canvas')) {
        // Clicked on empty canvas
        deselectAll();
      }

      // Close context menus
      setCanvasCtxMenu(null);
      setElementCtxMenu(null);
    },
    [selectElement, deselectAll],
  );

  // ── Wheel zoom ─────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const store = useDiagramStore.getState();
      const newZoom = Math.max(0.1, Math.min(5, store.view.zoom + delta));
      store.setZoom(newZoom);
    }
  }, []);

  return (
    <div
      ref={canvasRef}
      id="graph-canvas"
      className={`diagram-canvas ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: activeDiagram?.backgroundColor ?? '#FFFFFF',
        backgroundImage: gridVisible
          ? `radial-gradient(circle, #ddd 1px, transparent 1px)`
          : 'none',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${view.x % gridSize}px ${view.y % gridSize}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      data-testid="diagram-canvas"
    >
      {/* mxGraph / SVG rendering area */}
      <svg
        className="diagram-svg"
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${view.zoom}) translate(${view.x}px, ${view.y}px)`,
        }}
      >
        {/* Diagram elements rendered by mxGraph or React */}
        {/* Elements from activeDiagram */}
        {activeDiagram?.elements.map((el) => (
          <g
            key={el.id}
            data-element-id={el.id}
            data-element-type={el.elementId}
            transform={`translate(${el.x}, ${el.y})`}
            className={`diagram-element${selectedElementIds.includes(el.id) ? ' selected' : ''}${
              el.locked ? ' locked' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              selectElement(el.id, e.ctrlKey || e.metaKey);
            }}
          >
            <rect
              width={el.width}
              height={el.height}
              rx={4}
              ry={4}
              fill={(el.customStyle as Record<string, string>)['fillColor'] ?? '#cccccc'}
              stroke={selectedElementIds.includes(el.id) ? '#3366ff' : '#666'}
              strokeWidth={selectedElementIds.includes(el.id) ? 2 : 1}
            />
            <text
              x={el.width / 2}
              y={el.height / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fill="#333"
              pointerEvents="none"
            >
              {el.elementId}
            </text>
          </g>
        ))}

        {/* Connections */}
        {activeDiagram?.connections.map((conn) => {
          const source = activeDiagram.elements.find(
            (e) => e.id === conn.sourceElementId,
          );
          const target = activeDiagram.elements.find(
            (e) => e.id === conn.targetElementId,
          );
          if (!source || !target) return null;

          const sx = source.x + source.width / 2;
          const sy = source.y + source.height / 2;
          const tx = target.x + target.width / 2;
          const ty = target.y + target.height / 2;

          return (
            <line
              key={conn.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="#666"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Grid overlay */}
      {gridVisible && <div className="grid-overlay" />}

      {/* Connection indicator */}
      {isConnecting && <div className="connection-indicator" />}

      {/* ── Context Menus ──────────────────────────────────────── */}
      <CanvasContextMenu
        position={canvasCtxMenu}
        onClose={() => setCanvasCtxMenu(null)}
      />

      <ElementContextMenu
        position={elementCtxMenu}
        elementId={elementCtxMenu?.elementId ?? null}
        elementType={elementCtxMenu?.elementType}
        onClose={() => setElementCtxMenu(null)}
      />
    </div>
  );
};

export default DiagramCanvas;
