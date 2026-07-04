// ============================================================================
// Port Registry — connection port definitions for ArchiMate elements
// ============================================================================

import { ArchiMateElementType, CATEGORY_MAP, ArchiMateCategory } from '../types/archimate';
import { RelationshipType, RELATIONSHIP_COMPATIBILITY, isRelationshipCompatible } from '../types/relationships';
import { DiagramElement } from '../types/domain';

// ── Port types and configurations ─────────────────────────────────────────

export type PortDirection = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' | 'center';

export type PortType = 'edge' | 'corner' | 'center' | 'custom';

export interface PortConstraint {
  /** Direction allowed for connections */
  direction: PortDirection;
  /** Whether connections are allowed in this direction */
  allowed: boolean;
  /** Maximum connections from this port (-1 = unlimited) */
  maxConnections: number;
  /** Relationship types allowed on this port (empty = all) */
  allowedRelationshipTypes: RelationshipType[];
}

export interface PortPosition {
  /** Normalized X offset (-0.5 to 0.5 relative to element center) */
  nx: number;
  /** Normalized Y offset (-0.5 to 0.5 relative to element center) */
  ny: number;
  /** Port direction label */
  direction: PortDirection;
}

export interface PortConfig {
  /** Port type */
  type: PortType;
  /** Number of ports */
  count: number;
  /** Port positions relative to element center (normalized -0.5..0.5) */
  positions: PortPosition[];
  /** Whether ports are visible on the canvas */
  visible: boolean;
  /** Connection constraints per port */
  constraints: PortConstraint[];
  /** Priority directions for automatic routing */
  priorityDirections: PortDirection[];
}

// ── Default port configurations per category ──────────────────────────────

const DEFAULT_PORT_CONFIG: PortConfig = {
  type: 'edge',
  count: 4,
  positions: [
    { nx: 0, ny: -0.5, direction: 'north' },
    { nx: 0, ny: 0.5, direction: 'south' },
    { nx: -0.5, ny: 0, direction: 'west' },
    { nx: 0.5, ny: 0, direction: 'east' },
  ],
  visible: false,
  constraints: buildDefaultConstraints(),
  priorityDirections: ['east', 'west', 'north', 'south'],
};

function buildDefaultConstraints(): PortConstraint[] {
  return [
    { direction: 'north', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
    { direction: 'south', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
    { direction: 'east', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
    { direction: 'west', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
  ];
}

// ── Port registry ─────────────────────────────────────────────────────────

export class PortRegistry {
  private ports: Map<string, PortConfig> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /** Register default port configurations for each category */
  private registerDefaults(): void {
    // ── Actor ports (all sides) ───────────────────────────────────────
    this.ports.set('actor', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Collaboration ports (all sides + corners) ───────────────────
    this.ports.set('collaboration', {
      type: 'edge',
      count: 8,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
        { nx: -0.5, ny: -0.5, direction: 'northwest' },
        { nx: 0.5, ny: -0.5, direction: 'northeast' },
        { nx: -0.5, ny: 0.5, direction: 'southwest' },
        { nx: 0.5, ny: 0.5, direction: 'southeast' },
      ],
      visible: false,
      constraints: [
        { direction: 'north', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'south', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'east', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'west', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'northeast', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'northwest', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'southeast', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'southwest', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
      ],
      priorityDirections: ['east', 'west', 'south', 'north'],
    });

    // ── Event ports (top and bottom for triggering) ──────────────────
    this.ports.set('event', {
      type: 'edge',
      count: 2,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
      ],
      visible: false,
      constraints: [
        { direction: 'north', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'south', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'east', allowed: false, maxConnections: 0, allowedRelationshipTypes: [] },
        { direction: 'west', allowed: false, maxConnections: 0, allowedRelationshipTypes: [] },
      ],
      priorityDirections: ['south', 'north'],
    });

    // ── Function ports (left and right for flow) ──────────────────────
    this.ports.set('function', {
      type: 'edge',
      count: 2,
      positions: [
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: [
        { direction: 'east', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'west', allowed: true, maxConnections: -1, allowedRelationshipTypes: [] },
        { direction: 'north', allowed: false, maxConnections: 0, allowedRelationshipTypes: [] },
        { direction: 'south', allowed: false, maxConnections: 0, allowedRelationshipTypes: [] },
      ],
      priorityDirections: ['east', 'west'],
    });

    // ── Interaction ports (all sides) ────────────────────────────────
    this.ports.set('interaction', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Interface ports (center and sides) ──────────────────────────
    this.ports.set('interface', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Object ports (all sides) ────────────────────────────────────
    this.ports.set('object', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Process ports (all sides) ──────────────────────────────────
    this.ports.set('process', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Service ports (all sides) ──────────────────────────────────
    this.ports.set('service', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Physical ports (all sides) ─────────────────────────────────
    this.ports.set('physical', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Motivation ports (all sides) ───────────────────────────────
    this.ports.set('motivation', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Implementation ports (all sides) ──────────────────────────
    this.ports.set('implementation', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });

    // ── Other ports (center + 4 edges) ─────────────────────────────
    this.ports.set('other', {
      type: 'edge',
      count: 4,
      positions: [
        { nx: 0, ny: -0.5, direction: 'north' },
        { nx: 0, ny: 0.5, direction: 'south' },
        { nx: -0.5, ny: 0, direction: 'west' },
        { nx: 0.5, ny: 0, direction: 'east' },
      ],
      visible: false,
      constraints: buildDefaultConstraints(),
      priorityDirections: ['east', 'west', 'north', 'south'],
    });
  }

  /** Get port configuration for an element type */
  getConfigForType(type: ArchiMateElementType): PortConfig {
    const category = CATEGORY_MAP[type];
    return this.getConfig(category) ?? DEFAULT_PORT_CONFIG;
  }

  /** Get port configuration for a category */
  getConfig(category: ArchiMateCategory): PortConfig | undefined {
    return this.ports.get(category) ?? DEFAULT_PORT_CONFIG;
  }

  /** Register custom port configuration for a category */
  registerPorts(category: ArchiMateCategory, config: Partial<PortConfig>): void {
    const existing = this.ports.get(category) ?? DEFAULT_PORT_CONFIG;
    this.ports.set(category, { ...existing, ...config });
  }

  // ── Connection point calculations ─────────────────────────────────

  /**
   * Get the connection point on an element closest to the target.
   */
  getConnectionPoint(
    element: DiagramElement,
    targetX: number,
    targetY: number,
  ): { x: number; y: number } {
    const config = this.getConfig('other');
    if (!config) return { x: element.x, y: element.y };
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    let bestPoint = { x: cx, y: cy };
    let bestDist = Infinity;

    for (const pos of config.positions) {
      const px = cx + pos.nx * element.width;
      const py = cy + pos.ny * element.height;
      const dist = Math.hypot(px - targetX, py - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = { x: px, y: py };
      }
    }

    return bestPoint;
  }

  /**
   * Get all port positions for an element (for visualization).
   */
  getPortPositions(
    element: DiagramElement,
    category: ArchiMateCategory,
  ): { x: number; y: number }[] {
    const config = this.getConfig(category);
    if (!config) return [];

    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    return config.positions.map((pos) => ({
      x: cx + pos.nx * element.width,
      y: cy + pos.ny * element.height,
    }));
  }

  // ── Port validation ───────────────────────────────────────────────

  /**
   * Check if a connection is allowed from a port direction.
   */
  isConnectionAllowed(
    category: ArchiMateCategory,
    direction: PortDirection,
  ): boolean {
    const config = this.getConfig(category);
    if (!config) return true;

    const constraint = config.constraints.find((c) => c.direction === direction);
    return constraint?.allowed ?? true;
  }

  /**
   * Validate a relationship connection between two elements.
   * Returns true if the connection is valid per ArchiMate compatibility rules.
   */
  validateConnection(
    sourceType: ArchiMateElementType,
    targetType: ArchiMateElementType,
    relationshipType: RelationshipType,
  ): boolean {
    return isRelationshipCompatible(relationshipType, sourceType, targetType);
  }

  /**
   * Check if a relationship type is compatible with the port direction
   * for a given element category.
   */
  isRelationshipAllowedAtPort(
    category: ArchiMateCategory,
    direction: PortDirection,
    relationshipType: RelationshipType,
  ): boolean {
    const config = this.getConfig(category);
    if (!config) return true;

    const constraint = config.constraints.find((c) => c.direction === direction);
    if (!constraint || !constraint.allowed) return false;

    // If the constraint specifies allowed relationship types, check
    if (constraint.allowedRelationshipTypes.length > 0) {
      return constraint.allowedRelationshipTypes.includes(relationshipType);
    }

    return true;
  }

  /**
   * Get preferred connection direction between two elements.
   */
  getPreferredDirection(
    source: DiagramElement,
    target: DiagramElement,
  ): PortDirection {
    const scx = source.x + source.width / 2;
    const scy = source.y + source.height / 2;
    const tcx = target.x + target.width / 2;
    const tcy = target.y + target.height / 2;

    const dx = tcx - scx;
    const dy = tcy - scy;

    // Determine primary axis
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'east' : 'west';
    }
    return dy > 0 ? 'south' : 'north';
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

export const portRegistry = new PortRegistry();
