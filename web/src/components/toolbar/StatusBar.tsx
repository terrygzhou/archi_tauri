import React from 'react';
import { useModelStore } from '../../stores/modelStore';
import { useDiagramStore } from '../../stores/diagramStore';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

// ============================================================================
// Status bar component
// ============================================================================

export interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const { model, isDirty } = useModelStore();
  const { activeDiagram, view, selectedElementIds, selectedConnectionIds } = useDiagramStore();

  return (
    <div className={`status-bar ${className}`}>
      <div className="status-left">
        {/* Model info */}
        <span className="status-item">
          {model ? (
            <>
              <span className="model-name">{model.name}</span>
              {isDirty && <span className="dirty-indicator" title="Unsaved">*</span>}
            </>
          ) : (
            'No model'
          )}
        </span>

        {/* Element counts */}
        {model && (
          <span className="status-item">
            {model.elements.length} elements · {model.relationships.length} relationships
          </span>
        )}

        {/* Diagram info */}
        {activeDiagram && (
          <span className="status-item">
            Diagram: {activeDiagram.name}
          </span>
        )}

        {/* Selection info */}
        <span className="status-item">
          {selectedElementIds.length} selected
        </span>
      </div>

      <div className="status-right">
        {/* View info */}
        <span className="status-item">
          Zoom: {Math.round(view.zoom * 100)}%
        </span>
        <span className="status-item">
          Position: ({Math.round(view.x)}, {Math.round(view.y)})
        </span>

        {/* Version */}
        <span className="status-item">
          {APP_NAME} v{APP_VERSION}
        </span>
      </div>
    </div>
  );
};
