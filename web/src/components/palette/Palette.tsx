import React, { useState, useMemo, useCallback } from 'react';
import {
  ArchiMateElementType,
  ArchiMateLayer,
  LAYER_COLORS,
  FOLDER_HIERARCHY,
  TYPE_LAYER_MAP,
  ALL_ELEMENT_TYPES,
} from '../../types/archimate';
import { getShapeConfig, shapeToStyleStr, SHAPE_REGISTRY } from '../../diagram/shapes';
import { useDiagramStore } from '../../stores/diagramStore';
import './Palette.css';

// ============================================================================
// Layer section definitions (ordered as ArchiMate spec defines them)
// ============================================================================

interface LayerSectionDef {
  key: ArchiMateLayer;
  label: string;
  icon: string;
  description: string;
}

export const LAYER_SECTIONS: LayerSectionDef[] = [
  {
    key: 'strategy',
    label: 'Strategy',
    icon: '🎯',
    description: 'Capabilities, value streams, and strategic planning elements',
  },
  {
    key: 'business',
    label: 'Business',
    icon: '🏢',
    description: 'Actors, processes, services, and business interactions',
  },
  {
    key: 'application',
    label: 'Application',
    icon: '💻',
    description: 'Application components, services, and interfaces',
  },
  {
    key: 'technology',
    label: 'Technology',
    icon: '⚙️',
    description: 'Technology infrastructure, platforms, and networks',
  },
  {
    key: 'physical',
    label: 'Physical',
    icon: '🏗️',
    description: 'Facilities, equipment, and distribution networks',
  },
  {
    key: 'implementation',
    label: 'Implementation',
    icon: '📋',
    description: 'Work packages, plateaus, gaps, and deliverables',
  },
  {
    key: 'motivation',
    label: 'Motivation',
    icon: '💡',
    description: 'Goals, requirements, values, and drivers',
  },
  {
    key: 'other',
    label: 'Other',
    icon: '📦',
    description: 'Groupings, data objects, notes, and misc elements',
  },
];

// ============================================================================
// Helper: prettify kebab-case element type to display name
// ============================================================================

function elementDisplayName(type: ArchiMateElementType): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Mini SVG shape preview for palette items
// ============================================================================

interface ElementIconProps {
  type: ArchiMateElementType;
  size?: number;
}

const ElementIcon: React.FC<ElementIconProps> = ({ type, size = 28 }) => {
  const shape = getShapeConfig(type);
  const color = shape.fillColor;
  const stroke = shape.strokeColor;
  const mxShape = shape.mxShape;

  // Render a simple SVG representation of the shape
  const renderShape = useCallback(() => {
    switch (mxShape) {
      case 'actor':
        return (
          <path
            d="M14,4 C10,4 8,7 8,10 C8,13 10,14 10,16 L10,24 L18,24 L18,16 C18,14 20,13 20,10 C20,7 18,4 14,4 Z"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'doubleRectangle':
        return (
          <>
            <rect
              x="3"
              y="3"
              width="22"
              height="22"
              fill={color}
              stroke={stroke}
              strokeWidth="1"
            />
            <rect
              x="6"
              y="6"
              width="16"
              height="16"
              fill="none"
              stroke={stroke}
              strokeWidth="0.8"
            />
          </>
        );
      case 'ellipse':
        return (
          <ellipse
            cx="14"
            cy="14"
            rx="12"
            ry="9"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'roundRect':
        return (
          <rect
            x="2"
            y="5"
            width="24"
            height="18"
            rx="3"
            ry="3"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'rectangle':
        return (
          <rect
            x="2"
            y="5"
            width="24"
            height="18"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'cylinder':
        return (
          <>
            <ellipse cx="14" cy="6" rx="10" ry="3" fill={color} stroke={stroke} strokeWidth="1" />
            <rect x="4" y="6" width="20" height="16" fill={color} stroke={stroke} strokeWidth="1" />
            <ellipse cx="14" cy="22" rx="10" ry="3" fill={color} stroke={stroke} strokeWidth="1" />
          </>
        );
      case 'cube':
        return (
          <>
            <polygon
              points="2,14 12,6 22,14 12,22"
              fill={color}
              stroke={stroke}
              strokeWidth="1"
            />
            <polygon
              points="2,14 12,6 12,16 2,22"
              fill={lightenHex(color, 0.3)}
              stroke={stroke}
              strokeWidth="0.5"
            />
            <polygon
              points="12,6 22,14 22,22 12,16"
              fill={darkenHex(color, 0.15)}
              stroke={stroke}
              strokeWidth="0.5"
            />
          </>
        );
      case 'note':
        return (
          <path
            d="M4,4 L18,4 L22,8 L22,22 L4,22 Z"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'document':
        return (
          <>
            <path
              d="M3,3 L18,3 L22,7 L22,22 L3,22 Z"
              fill={color}
              stroke={stroke}
              strokeWidth="1"
            />
            <path d="M18,3 L18,7 L22,7" fill="none" stroke={stroke} strokeWidth="0.8" />
          </>
        );
      case 'hexagon':
        return (
          <polygon
            points="14,2 24,8 24,20 14,26 4,20 4,8"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'rhombus':
        return (
          <polygon
            points="14,2 24,14 14,26 4,14"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'triangle':
        return (
          <polygon
            points="14,2 24,24 4,24"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'parallelogram':
        return (
          <polygon
            points="5,6 22,6 20,20 3,20"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'target':
        return (
          <>
            <circle cx="14" cy="14" r="12" fill={color} stroke={stroke} strokeWidth="1" />
            <circle cx="14" cy="14" r="7" fill="none" stroke={stroke} strokeWidth="0.8" />
            <circle cx="14" cy="14" r="3" fill={stroke} />
          </>
        );
      case 'circle':
        return (
          <circle
            cx="14"
            cy="14"
            r="12"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'file':
        return (
          <>
            <path
              d="M4,4 L16,4 L20,8 L20,22 L4,22 Z"
              fill={color}
              stroke={stroke}
              strokeWidth="1"
            />
          </>
        );
      case 'step':
        return (
          <path
            d="M3,20 L3,8 L10,8 L10,14 L18,14 L18,6 L22,6 L22,20 L3,20 Z"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
      case 'swimLane':
        return (
          <>
            <rect
              x="2"
              y="5"
              width="24"
              height="18"
              fill={color}
              stroke={stroke}
              strokeWidth="1"
            />
            <line x1="2" y1="12" x2="26" y2="12" stroke={stroke} strokeWidth="0.8" />
          </>
        );
      case 'link':
        return (
          <>
            <line
              x1="2"
              y1="14"
              x2="26"
              y2="14"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        );
      default:
        return (
          <rect
            x="2"
            y="5"
            width="24"
            height="18"
            fill={color}
            stroke={stroke}
            strokeWidth="1"
          />
        );
    }
  }, [mxShape, color, stroke]);

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className="palette-element-icon">
      {renderShape()}
    </svg>
  );
};

// ============================================================================
// Color helpers
// ============================================================================

function lightenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function darkenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// ============================================================================
// Palette Layer Section (collapsible)
// ============================================================================

interface PaletteSectionProps {
  layerKey: ArchiMateLayer;
  sectionDef: LayerSectionDef;
  searchQuery: string;
  onDragStart: (type: ArchiMateElementType, e: React.DragEvent) => void;
}

const PaletteSection: React.FC<PaletteSectionProps> = ({
  layerKey,
  sectionDef,
  searchQuery,
  onDragStart,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const color = LAYER_COLORS[layerKey];

  const types = useMemo(() => {
    const layerTypes = FOLDER_HIERARCHY[layerKey] ?? [];
    if (!searchQuery) return layerTypes;
    const q = searchQuery.toLowerCase();
    return layerTypes.filter((t) => {
      const display = elementDisplayName(t);
      return display.toLowerCase().includes(q) || t.toLowerCase().includes(q);
    });
  }, [layerKey, searchQuery]);

  if (types.length === 0 && searchQuery) return null;
  if (types.length === 0) return null;

  return (
    <div className="palette-section">
      <button
        className={`palette-section-header ${collapsed ? 'collapsed' : ''}`}
        style={{ borderLeftColor: color, borderLeftWidth: 4 }}
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls={`palette-section-${layerKey}`}
      >
        <span className="palette-section-toggle">{collapsed ? '▶' : '▼'}</span>
        <span className="palette-section-icon">{sectionDef.icon}</span>
        <span className="palette-section-label">{sectionDef.label}</span>
        <span className="palette-section-count">
          {types.length}
          {collapsed && ` (${types.length} hidden)`}
        </span>
      </button>

      {!collapsed && (
        <div
          id={`palette-section-${layerKey}`}
          className="palette-section-content"
          role="list"
        >
          {types.map((type) => (
            <PaletteItem
              key={type}
              type={type}
              color={color}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Palette Item (draggable element)
// ============================================================================

interface PaletteItemProps {
  type: ArchiMateElementType;
  color: string;
  onDragStart: (type: ArchiMateElementType, e: React.DragEvent) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, color, onDragStart }) => {
  const displayName = elementDisplayName(type);

  return (
    <div
      className="palette-item"
      draggable
      onDragStart={(e) => onDragStart(type, e)}
      title={`${displayName} (${type})`}
      role="listitem"
      tabIndex={0}
      aria-label={`Drag ${displayName} to canvas`}
    >
      <ElementIcon type={type} size={28} />
      <span className="palette-item-label">{displayName}</span>
    </div>
  );
};

// ============================================================================
// Palette component — main element palette with search and layer sections
// ============================================================================

export interface PaletteProps {
  className?: string;
}

export const Palette: React.FC<PaletteProps> = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeDiagramId, createAndAddElement } = useDiagramStore();

  // Handle drag start — set data transfer for the element type
  const handleDragStart = useCallback(
    (type: ArchiMateElementType, e: React.DragEvent) => {
      e.dataTransfer.setData('application/archimate', type);
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  // Count total types matching search
  const totalCount = useMemo(() => {
    if (!searchQuery) return ALL_ELEMENT_TYPES.length;
    const q = searchQuery.toLowerCase();
    return ALL_ELEMENT_TYPES.filter(
      (t) =>
        elementDisplayName(t).toLowerCase().includes(q) ||
        t.toLowerCase().includes(q),
    ).length;
  }, [searchQuery]);

  const hasResults = searchQuery && totalCount > 0;
  const isEmpty = searchQuery && totalCount === 0;

  return (
    <div className={`palette ${className}`} role="complementary" aria-label="Element Palette">
      {/* Header */}
      <div className="palette-header">
        <h3 className="palette-title">Elements</h3>
        <span className="palette-count-badge">{totalCount}</span>
      </div>

      {/* Search */}
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search elements…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="palette-search-input"
          aria-label="Search element types"
        />
        {searchQuery && (
          <button
            className="palette-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isEmpty && (
        <div className="palette-empty">
          <p>No elements match "{searchQuery}"</p>
        </div>
      )}

      {/* Layer sections */}
      <div className="palette-sections" role="list">
        {LAYER_SECTIONS.map((sectionDef) => (
          <PaletteSection
            key={sectionDef.key}
            layerKey={sectionDef.key}
            sectionDef={sectionDef}
            searchQuery={hasResults ? searchQuery : ''}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default Palette;
