import React, { useEffect, useMemo, useRef } from 'react';
import { useModelStore } from './stores/modelStore';
import { useDiagramStore } from './stores/diagramStore';
import { useCommandStack } from './stores/commandStack';
import { useUIStore } from './stores/uiStore';
import { ArchiGraph } from './diagram/graph';
import { Toolbar } from './components/toolbar/Toolbar';
import { Explorer } from './components/explorer/Explorer';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { Palette } from './components/palette/Palette';
import { DiagramCanvas } from './components/diagram/DiagramCanvas';
import { StatusBar } from './components/toolbar/StatusBar';
import { NotificationBanner } from './components/toolbar/NotificationBanner';
import { Model, ModelFactory } from './types/domain';
import { ARCHIMATE_VERSION, APP_NAME, APP_VERSION } from './utils/constants';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// ============================================================================
// Root App Component
// ============================================================================
const App: React.FC = () => {
  const graphRef = useRef<ArchiGraph | null>(null);
  const { model, createModel, isOpen, isDirty, setModel } = useModelStore();
  const { activeDiagram, diagrams, addDiagram, setActiveDiagram } = useDiagramStore();
  const { clear: clearCommandStack } = useCommandStack();
  const {
    explorerPosition,
    propertiesPosition,
    palettePosition,
    showToolbar,
    showStatusbar,
    preferences,
    notifications,
  } = useUIStore();

  // Initialize default model on mount
  useEffect(() => {
    if (!isOpen) {
      createModel('Untitled Model');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize mxGraph
  useEffect(() => {
    graphRef.current = new ArchiGraph({
      containerId: 'graph-container',
      gridSize: 10,
      gridVisible: true,
      gridSnap: true,
    });
    return () => {
      graphRef.current?.destroy();
    };
  }, []);

  // Keyboard shortcuts — wired via hook
  useKeyboardShortcuts();

  const layoutClasses = React.useMemo(() => {
    const classes = ['app-layout'];
    if (explorerPosition === 'left') classes.push('explorer-left');
    if (propertiesPosition === 'right') classes.push('properties-right');
    if (palettePosition !== 'hidden') classes.push('palette-visible');
    if (showToolbar) classes.push('toolbar-visible');
    if (showStatusbar) classes.push('statusbar-visible');
    return classes;
  }, [explorerPosition, propertiesPosition, palettePosition, showToolbar, showStatusbar]);

  return (
    <div className={layoutClasses.join(' ')}>
      {/* Toolbar */}
      {showToolbar && (
        <Toolbar />
      )}

      {/* Main content area */}
      <div className="main-content">
        {/* Left panel — Explorer */}
        {explorerPosition === 'left' && (
          <div className="left-panel">
            <Explorer />
          </div>
        )}

        {/* Center — Diagram canvas */}
        <div className="canvas-area">
          <DiagramCanvas />
        </div>

        {/* Right panel — Properties */}
        {propertiesPosition === 'right' && (
          <div className="right-panel">
            <PropertiesPanel />
          </div>
        )}

        {/* Palette overlay */}
        {palettePosition !== 'hidden' && (
          <div className={`palette-overlay palette-${palettePosition}`}>
            <Palette />
          </div>
        )}
      </div>

      {/* Status bar */}
      {showStatusbar && (
        <StatusBar />
      )}

      {/* Notifications */}
      <NotificationBanner />
    </div>
  );
};

export default App;
