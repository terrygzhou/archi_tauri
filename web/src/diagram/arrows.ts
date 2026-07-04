// ============================================================================
// Arrow Registry — maps all 14 ArchiMate relationship types to mxGraph arrow configs
// ============================================================================

import { RelationshipType, ALL_RELATIONSHIP_TYPES } from '../types/relationships';

// ── Arrow configuration types ─────────────────────────────────────────────

export interface ArrowConfig {
  /** mxGraph shape name for the arrow */
  shapeName: string;
  /** Arrowhead type at the target end */
  targetArrow: string;
  /** Arrowhead type at the source end */
  sourceArrow: string;
  /** Line style: solid, dashed, dotted */
  lineStyle: 'solid' | 'dashed' | 'dotted';
  /** Line color */
  strokeColor: string;
  /** Line width */
  strokeWidth: number;
  /** Whether the line is dashed */
  dashed: boolean;
  /** Dash pattern (mxGraph format, e.g. '6 3') */
  dashPattern: string;
  /** Target arrow style for SVG marker */
  targetStyle: string;
  /** Source arrow style for SVG marker */
  sourceStyle: string;
  /** Additional mxGraph edge style properties */
  extra: Record<string, string | number | boolean>;
}

// ── Arrow registry: all 14 types per ArchiMate 3.2 spec ────────────────────

export const ARROW_REGISTRY: Readonly<Record<string, ArrowConfig>> = Object.freeze({
  // ── Access: dashed line, open (closed) triangle target ──────────────────
  access: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#0066CC',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Serving: solid line, closed triangle target ─────────────────────────
  serving: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#0066CC',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Realization: dashed line, hollow (open) triangle target ─────────────
  realization: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#006633',
    strokeWidth: 2,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Assignment: dot source, closed triangle target ──────────────────────
  assignment: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'oval',
    lineStyle: 'solid',
    strokeColor: '#333333',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'block',
    sourceStyle: 'oval',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Triggering: solid line, triangle-gap target ─────────────────────────
  triggering: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#CC6600',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
      endSize: 5,
    },
  },

  // ── Flow: dashed (6:3), closed triangle target ─────────────────────────
  flow: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#0066CC',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Structure: solid line, open triangle target ─────────────────────────
  structure: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#333333',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Aggregation: solid line, open triangle target ──────────────────────
  aggregation: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#333333',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Association: solid line, open triangle target ──────────────────────
  association: {
    shapeName: 'arrow',
    targetArrow: 'none',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#666666',
    strokeWidth: 1,
    dashed: false,
    dashPattern: '',
    targetStyle: 'none',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Specialization: dashed line, open triangle target ──────────────────
  specialization: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#993300',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Composition: solid line, filled diamond target ─────────────────────
  composition: {
    shapeName: 'arrow',
    targetArrow: 'diamond',
    sourceArrow: 'none',
    lineStyle: 'solid',
    strokeColor: '#333333',
    strokeWidth: 2,
    dashed: false,
    dashPattern: '',
    targetStyle: 'diamond',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Conditional: dashed line, open triangle target ─────────────────────
  conditional: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#993399',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Correlation: dashed line, half-open target ─────────────────────────
  correlation: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dashed',
    strokeColor: '#993399',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '6 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },

  // ── Influence: dotted line, closed triangle target ────────────────────
  influence: {
    shapeName: 'arrow',
    targetArrow: 'block',
    sourceArrow: 'none',
    lineStyle: 'dotted',
    strokeColor: '#993300',
    strokeWidth: 1,
    dashed: true,
    dashPattern: '1 3',
    targetStyle: 'block',
    sourceStyle: 'none',
    extra: {
      sourcePerimeter: false,
      targetPerimeter: false,
      edgeStyle: 'orthogonalEdgeStyle',
    },
  },
});

// ── Public API ──────────────────────────────────────────────────────────────

/** Get arrow config for a relationship type */
export function getArrowConfig(type: RelationshipType): ArrowConfig {
  const config = ARROW_REGISTRY[type];
  if (!config) {
    // Fallback for unknown types
    return {
      shapeName: 'arrow',
      targetArrow: 'block',
      sourceArrow: 'none',
      lineStyle: 'solid',
      strokeColor: '#666666',
      strokeWidth: 1,
      dashed: false,
      dashPattern: '',
      targetStyle: 'block',
      sourceStyle: 'none',
      extra: {},
    };
  }
  return config;
}

/** Get mxGraph edge style object for a relationship type */
export function getArrowStyle(type: RelationshipType): ArrowConfig {
  return getArrowConfig(type);
}

/** Check if a relationship type is registered */
export function hasArrowStyle(type: string): boolean {
  return type in ARROW_REGISTRY;
}

/** Get all registered relationship types */
export function getRegisteredTypes(): RelationshipType[] {
  return [...ALL_RELATIONSHIP_TYPES] as RelationshipType[];
}

// ── SVG Marker Definitions ──────────────────────────────────────────────────

/**
 * Generate SVG marker definitions for all arrow types.
 * These <marker> elements should be placed in an SVG <defs> block.
 */
export function getSVGMarkerDefs(): string {
  const markers: string[] = [];

  // ── Block arrow (closed triangle) ─────────────────────────────────────
  markers.push(
    '<marker id="marker-block" markerWidth="10" markerHeight="10" refX="10" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<path d="M 0 0 L 10 3 L 0 6 Z" fill="#000000" />'
    + '</marker>',
  );

  // ── Open triangle (hollow) ──────────────────────────────────────────
  markers.push(
    '<marker id="marker-open" markerWidth="10" markerHeight="10" refX="10" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<path d="M 0 0 L 10 3 L 0 6 Z" fill="none" stroke="#000000" stroke-width="1" />'
    + '</marker>',
  );

  // ── Diamond (filled) ────────────────────────────────────────────────
  markers.push(
    '<marker id="marker-diamond" markerWidth="8" markerHeight="8" refX="8" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<path d="M 0 3 L 4 0 L 8 3 L 4 6 Z" fill="#000000" />'
    + '</marker>',
  );

  // ── Open diamond ────────────────────────────────────────────────────
  markers.push(
    '<marker id="marker-diamond-open" markerWidth="8" markerHeight="8" refX="8" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<path d="M 0 3 L 4 0 L 8 3 L 4 6 Z" fill="none" stroke="#000000" stroke-width="1" />'
    + '</marker>',
  );

  // ── Oval (dot) ──────────────────────────────────────────────────────
  markers.push(
    '<marker id="marker-oval" markerWidth="6" markerHeight="6" refX="3" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<circle cx="3" cy="3" r="2.5" fill="#000000" />'
    + '</marker>',
  );

  // ── Cross ──────────────────────────────────────────────────────────
  markers.push(
    '<marker id="marker-cross" markerWidth="8" markerHeight="8" refX="4" refY="4" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<path d="M 1 1 L 7 7 M 7 1 L 1 7" stroke="#000000" stroke-width="1.5" />'
    + '</marker>',
  );

  // ── Circle (hollow) ─────────────────────────────────────────────────
  markers.push(
    '<marker id="marker-circle" markerWidth="6" markerHeight="6" refX="3" refY="3" '
    + 'orient="auto" markerUnits="strokeWidth">'
    + '<circle cx="3" cy="3" r="2.5" fill="none" stroke="#000000" stroke-width="1" />'
    + '</marker>',
  );

  return markers.join('\n');
}

/**
 * Build a complete SVG <defs> block with all markers.
 */
export function getFullSVGDefs(): string {
  return '<defs>\n' + getSVGMarkerDefs() + '\n</defs>';
}

// ── Arrow style map for mxGraph edge styling ────────────────────────────────

/**
 * Convert an ArrowConfig to a mxGraph-compatible style string.
 */
export function configToStyleStr(config: ArrowConfig): string {
  const parts: string[] = [];
  parts.push(`edge=1`);
  parts.push(`sourceArrow=${config.sourceArrow}`);
  parts.push(`targetArrow=${config.targetArrow}`);
  parts.push(`strokeColor=${config.strokeColor}`);
  parts.push(`strokeWidth=${config.strokeWidth}`);
  parts.push(`dashed=${config.dashed}`);
  if (config.dashed && config.dashPattern) {
    parts.push(`dashPattern=${config.dashPattern}`);
  }
  for (const k of Object.keys(config.extra)) {
    parts.push(`${k}=${config.extra[k]}`);
  }
  return parts.join(';');
}

/**
 * Build the complete mxGraph style string for a relationship type.
 */
export function getEdgeStyle(type: RelationshipType): string {
  const config = getArrowConfig(type);
  return configToStyleStr(config);
}
