// ============================================================================
// Shape Registry — maps all 92 ArchiMate element types to mxGraph visual configs
// ============================================================================

import {
  ArchiMateElementType,
  LAYER_COLORS,
  TYPE_LAYER_MAP,
  CATEGORY_MAP,
  ArchiMateCategory,
  ALL_ELEMENT_TYPES,
  OtherElementType,
} from '../types/archimate';

// ── Shape configuration ──────────────────────────────────────────────────

export interface ShapeConfig {
  /** mxGraph shape name */
  mxShape: string;
  /** Fill color (layer-based) */
  fillColor: string;
  /** Stroke color (darker layer color) */
  strokeColor: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Label font style */
  fontStyle: number;
  /** Perimeter type for connection routing */
  perimeter: string;
  /** Corner arc factor (0 = square, 0.15 = rounded) */
  arcs: number;
  /** Icon override (optional) */
  icon: string | null;
  /** Image source for actor icons (optional) */
  image: string | null;
  /** Additional style properties */
  extraStyle: Record<string, string | number | boolean>;
}

// ── Layer colors ──────────────────────────────────────────────────────────
// Per task spec:
//   Business: green #009933
//   Application: blue #0066CC
//   Technology: orange #CC6600
//   Physical: purple #993399
//   Strategy: dark green #006633
//   Implementation: red #FF6600
//   Motivation: brown #993300
//   Other: grey #666666

// ── Shape registry ─────────────────────────────────────────────────────────

/** Build the shape config for a single element type */
function buildShapeConfig(
  type: ArchiMateElementType,
  category: ArchiMateCategory,
  layerColor: string,
): ShapeConfig {
  const dark = darkenColor(layerColor, 0.3);
  const base: ShapeConfig = {
    mxShape: shapeNameForCategory(category),
    fillColor: layerColor,
    strokeColor: dark,
    strokeWidth: 1,
    fontStyle: 0,
    perimeter: perimeterForCategory(category),
    arcs: arcsForCategory(category),
    icon: null,
    image: null,
    extraStyle: {},
  };

  // Apply category-specific overrides
  applyCategoryOverrides(base, category);

  // Apply type-specific overrides
  applyTypeOverrides(base, type, category);

  return base;
}

/** Map ArchiMateCategory → mxGraph shape name */
function shapeNameForCategory(category: ArchiMateCategory): string {
  switch (category) {
    case 'actor': return 'actor';
    case 'collaboration': return 'doubleRectangle';
    case 'event': return 'ellipse';
    case 'function': return 'ellipse';
    case 'interaction': return 'roundRect';
    case 'interface': return 'rectangle';
    case 'object': return 'rectangle';
    case 'process': return 'ellipse';
    case 'service': return 'roundRect';
    case 'physical': return 'cube';
    case 'motivation': return 'ellipse';
    case 'implementation': return 'roundRect';
    case 'other': return 'rectangle';
    default: return 'rectangle';
  }
}

/** Map ArchiMateCategory → perimeter type */
function perimeterForCategory(category: ArchiMateCategory): string {
  switch (category) {
    case 'event':
    case 'function':
    case 'motivation':
      return 'ellipsePerimeter';
    case 'actor':
    case 'service':
    case 'interaction':
      return 'roundRectPerimeter';
    default:
      return 'rectanglePerimeter';
  }
}

/** Map ArchiMateCategory → arc factor */
function arcsForCategory(category: ArchiMateCategory): number {
  switch (category) {
    case 'service':
    case 'interaction':
    case 'implementation':
      return 0.15;
    default:
      return 0;
  }
}

/** Apply category-level style overrides */
function applyCategoryOverrides(config: ShapeConfig, category: ArchiMateCategory): void {
  switch (category) {
    case 'actor':
      config.fontStyle = 1; // bold
      break;
    case 'event':
      config.fontStyle = 2; // italic
      break;
    case 'collaboration':
      config.strokeWidth = 1;
      break;
    case 'service':
      config.fontStyle = 1; // bold
      break;
  }
}

/** Apply type-specific overrides for special elements */
function applyTypeOverrides(
  config: ShapeConfig,
  type: ArchiMateElementType,
  _category: ArchiMateCategory,
): void {
  switch (type) {
    // ── Actor icons ────────────────────────────────────────────────────
    case 'business-actor':
      config.mxShape = 'actor';
      break;
    case 'business-role':
      config.mxShape = 'actor';
      break;
    case 'stakeholder':
      config.mxShape = 'actor';
      break;

    // ── Grouping → container shape ───────────────────────────────────
    case 'grouping':
      config.mxShape = 'doubleRectangle';
      config.strokeColor = lightenColor(config.strokeColor, 0.5);
      config.fillColor = 'none';
      break;

    // ── DataObject → cylinder ─────────────────────────────────────────
    case 'data-object':
      config.mxShape = 'cylinder';
      break;

    // ── Junction → circle with dot ────────────────────────────────────
    case 'junction':
      config.mxShape = 'ellipse';
      config.extraStyle['shape'] = 'ellipse';
      config.extraStyle['fillColor'] = config.fillColor;
      break;

    // ── Note → note card ──────────────────────────────────────────────
    case 'note':
      config.mxShape = 'note';
      config.fillColor = '#FFFFCC';
      config.strokeColor = '#CCCC99';
      break;

    // ── Artifact → document shape ────────────────────────────────────
    case 'artifact':
      config.mxShape = 'document';
      break;

    // ── Material → file shape ────────────────────────────────────────
    case 'material':
      config.mxShape = 'file';
      break;

    // ── LineConnection → line ─────────────────────────────────────────
    case 'line-connection':
      config.mxShape = 'line';
      config.fillColor = 'none';
      break;

    // ── Node → cube ──────────────────────────────────────────────────
    case 'node':
      config.mxShape = 'cube';
      break;

    // ── Facility / equipment → building ──────────────────────────────
    case 'facility':
    case 'equipment':
      config.mxShape = 'cube';
      break;

    // ── Communication paths ─────────────────────────────────────────
    case 'communication-network':
    case 'communication-path':
    case 'distribution-network':
      config.mxShape = 'link';
      break;

    // ── Boundary elements ───────────────────────────────────────────
    case 'domain':
      config.mxShape = 'doubleRectangle';
      break;

    // ── Motivation special shapes ────────────────────────────────────
    case 'goal':
      config.mxShape = 'target';
      break;
    case 'constraint':
      config.mxShape = 'parallelogram';
      break;
    case 'principle':
      config.mxShape = 'circle';
      break;
    case 'value':
      config.mxShape = 'hexagon';
      break;
    case 'milestone':
      config.mxShape = 'rhombus';
      break;
    case 'risk':
      config.mxShape = 'triangle';
      break;

    // ── Implementation shapes ────────────────────────────────────────
    case 'plateau':
      config.mxShape = 'step';
      break;
    case 'gap':
      config.mxShape = 'hexagon';
      config.fillColor = '#FFE0B2';
      config.strokeColor = '#FF6600';
      break;
    case 'work-package':
      config.mxShape = 'swimLane';
      break;
    case 'deliverable':
      config.mxShape = 'document';
      break;
    case 'contract':
      config.mxShape = 'note';
      break;

    // ── Strategy special shapes ──────────────────────────────────────
    case 'roadmap':
      config.mxShape = 'stepOver';
      break;
    case 'portfolio':
      config.mxShape = 'doubleRectangle';
      break;
    case 'capability-group':
      config.mxShape = 'doubleRectangle';
      break;

    default:
      break;
  }
}

// ── SHAPE_REGISTRY: populated for all 92 types ───────────────────────────

export const SHAPE_REGISTRY: Readonly<Map<ArchiMateElementType, ShapeConfig>> =
  buildShapeRegistry();

function buildShapeRegistry(): Readonly<Map<ArchiMateElementType, ShapeConfig>> {
  const registry = new Map<ArchiMateElementType, ShapeConfig>();

  for (const type of ALL_ELEMENT_TYPES) {
    const category = CATEGORY_MAP[type];
    const layer = TYPE_LAYER_MAP[type];
    const layerColor = LAYER_COLORS[layer];
    registry.set(type, buildShapeConfig(type, category, layerColor));
  }

  return Object.freeze(registry);
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Get the shape config for an element type */
export function getShapeConfig(type: ArchiMateElementType): ShapeConfig {
  const config = SHAPE_REGISTRY.get(type);
  if (!config) {
    // Fallback for unknown types
    return {
      mxShape: 'rectangle',
      fillColor: '#666666',
      strokeColor: '#333333',
      strokeWidth: 1,
      fontStyle: 0,
      perimeter: 'rectanglePerimeter',
      arcs: 0,
      icon: null,
      image: null,
      extraStyle: {},
    };
  }
  return config;
}

/** Convert a shape config to mxGraph style string */
export function shapeToStyleStr(config: ShapeConfig): string {
  const parts: string[] = [];
  parts.push(`shape=${config.mxShape}`);
  parts.push(`fillColor=${config.fillColor}`);
  parts.push(`strokeColor=${config.strokeColor}`);
  parts.push(`strokeWidth=${config.strokeWidth}`);
  if (config.fontStyle) parts.push(`fontStyle=${config.fontStyle}`);
  parts.push(`perimeter=${config.perimeter}`);
  parts.push(`arcSize=${Math.round(config.arcs * 100)}`);

  for (const k of Object.keys(config.extraStyle)) {
    const v = config.extraStyle[k];
    parts.push(`${k}=${v}`);
  }

  return parts.join(';');
}

// ── Color helpers ─────────────────────────────────────────────────────────

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return toHex(r, g, b);
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return toHex(r, g, b);
}

function toHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
