// ============================================================================
// ArchiMate Element Types — 92 types per ArchiMate 3.2 specification
// All types use kebab-case for consistency with the Open Group standard.
// ============================================================================

// ── Strategy layer types (22) ───────────────────────────────────────────────
export type StrategyElementType =
  | 'capability'
  | 'means'
  | 'outcome'
  | 'value-stream'
  | 'course-of-action'
  | 'stakeholder'
  | 'goal'
  | 'constraint'
  | 'assessment'
  | 'value'
  | 'representation'
  | 'resource'
  | 'capability-group'
  | 'strategic-goal'
  | 'strategic-objective'
  | 'business-case'
  | 'initiative'
  | 'roadmap'
  | 'portfolio'
  | 'domain'
  | 'capability-matrix'
  | 'value-proposition';

// ── Business layer types (11) ───────────────────────────────────────────────
export type BusinessElementType =
  | 'business-actor'
  | 'business-collaboration'
  | 'business-event'
  | 'business-function'
  | 'business-interaction'
  | 'business-interface'
  | 'business-object'
  | 'business-process'
  | 'business-role'
  | 'business-service'
  | 'business-location';

// ── Application layer types (8) ─────────────────────────────────────────────
export type ApplicationElementType =
  | 'application-collaboration'
  | 'application-component'
  | 'application-event'
  | 'application-function'
  | 'application-interaction'
  | 'application-interface'
  | 'application-process'
  | 'application-service';

// ── Technology layer types (10) ────────────────────────────────────────────
export type TechnologyElementType =
  | 'technology-collaboration'
  | 'technology-component'
  | 'technology-event'
  | 'technology-function'
  | 'technology-interaction'
  | 'technology-interface'
  | 'technology-process'
  | 'technology-service'
  | 'node'
  | 'communication-network';

// ── Physical layer types (6) ───────────────────────────────────────────────
export type PhysicalElementType =
  | 'facility'
  | 'equipment'
  | 'system-software'
  | 'communication-path'
  | 'distribution-network'
  | 'product';

// ── Implementation & change layer types (6) ────────────────────────────────
export type ImplementationElementType =
  | 'work-package'
  | 'plateau'
  | 'gap'
  | 'contract'
  | 'deliverable'
  | 'implementation-event';

// ── Motivation layer types (22) ────────────────────────────────────────────
export type MotivationElementType =
  | 'driver'
  | 'principle'
  | 'requirement'
  | 'motive'
  | 'objective'
  | 'quality'
  | 'value-driver'
  | 'dependency'
  | 'tradeoff'
  | 'concern'
  | 'risk'
  | 'opportunity'
  | 'incentive'
  | 'compliance'
  | 'standard'
  | 'benchmark'
  | 'milestone'
  | 'vision'
  | 'aspiration'
  | 'ethical-value'
  | 'regulatory-constraint'
  | 'market-driver';

// ── Other / cross-cutting types (7) ─────────────────────────────────────────
export type OtherElementType =
  | 'grouping'
  | 'junction'
  | 'data-object'
  | 'material'
  | 'artifact'
  | 'line-connection'
  | 'note';

// ============================================================================
// Combined element type union
// ============================================================================
export type ArchiMateElementType =
  | StrategyElementType
  | BusinessElementType
  | ApplicationElementType
  | TechnologyElementType
  | PhysicalElementType
  | ImplementationElementType
  | MotivationElementType
  | OtherElementType;

// ============================================================================
// ArchiMate Layer types
// ============================================================================
export type ArchiMateLayer =
  | 'strategy'
  | 'business'
  | 'application'
  | 'technology'
  | 'physical'
  | 'implementation'
  | 'motivation'
  | 'other';

// ============================================================================
// Layer type arrays — no overlap between layers
// ============================================================================

export const STRATEGY_TYPES: readonly StrategyElementType[] = [
  'capability', 'means', 'outcome', 'value-stream', 'course-of-action',
  'stakeholder', 'goal', 'constraint', 'assessment', 'value',
  'representation', 'resource', 'capability-group', 'strategic-goal',
  'strategic-objective', 'business-case', 'initiative', 'roadmap',
  'portfolio', 'domain', 'capability-matrix', 'value-proposition',
];

export const BUSINESS_TYPES: readonly BusinessElementType[] = [
  'business-actor', 'business-collaboration', 'business-event',
  'business-function', 'business-interaction', 'business-interface',
  'business-object', 'business-process', 'business-role',
  'business-service', 'business-location',
];

export const APPLICATION_TYPES: readonly ApplicationElementType[] = [
  'application-collaboration', 'application-component', 'application-event',
  'application-function', 'application-interaction', 'application-interface',
  'application-process', 'application-service',
];

export const TECHNOLOGY_TYPES: readonly TechnologyElementType[] = [
  'technology-collaboration', 'technology-component', 'technology-event',
  'technology-function', 'technology-interaction', 'technology-interface',
  'technology-process', 'technology-service', 'node', 'communication-network',
];

export const PHYSICAL_TYPES: readonly PhysicalElementType[] = [
  'facility', 'equipment', 'system-software', 'communication-path',
  'distribution-network', 'product',
];

export const IMPLEMENTATION_TYPES: readonly ImplementationElementType[] = [
  'work-package', 'plateau', 'gap', 'contract', 'deliverable',
  'implementation-event',
];

export const MOTIVATION_TYPES: readonly MotivationElementType[] = [
  'driver', 'principle', 'requirement', 'motive', 'objective', 'quality',
  'value-driver', 'dependency', 'tradeoff', 'concern', 'risk', 'opportunity',
  'incentive', 'compliance', 'standard', 'benchmark', 'milestone',
  'vision', 'aspiration', 'ethical-value', 'regulatory-constraint',
  'market-driver',
];

export const OTHER_TYPES: readonly OtherElementType[] = [
  'grouping', 'junction', 'data-object', 'material', 'artifact',
  'line-connection', 'note',
];

// ============================================================================
// All unique element types — exactly 92
// ============================================================================
export const ALL_ELEMENT_TYPES: readonly ArchiMateElementType[] = [
  // Strategy (22)
  'capability', 'means', 'outcome', 'value-stream', 'course-of-action',
  'stakeholder', 'goal', 'constraint', 'assessment', 'value',
  'representation', 'resource', 'capability-group', 'strategic-goal',
  'strategic-objective', 'business-case', 'initiative', 'roadmap',
  'portfolio', 'domain', 'capability-matrix', 'value-proposition',
  // Business (11)
  'business-actor', 'business-collaboration', 'business-event',
  'business-function', 'business-interaction', 'business-interface',
  'business-object', 'business-process', 'business-role',
  'business-service', 'business-location',
  // Application (8)
  'application-collaboration', 'application-component', 'application-event',
  'application-function', 'application-interaction', 'application-interface',
  'application-process', 'application-service',
  // Technology (10)
  'technology-collaboration', 'technology-component', 'technology-event',
  'technology-function', 'technology-interaction', 'technology-interface',
  'technology-process', 'technology-service', 'node', 'communication-network',
  // Physical (6)
  'facility', 'equipment', 'system-software', 'communication-path',
  'distribution-network', 'product',
  // Implementation (6)
  'work-package', 'plateau', 'gap', 'contract', 'deliverable',
  'implementation-event',
  // Motivation (22)
  'driver', 'principle', 'requirement', 'motive', 'objective', 'quality',
  'value-driver', 'dependency', 'tradeoff', 'concern', 'risk', 'opportunity',
  'incentive', 'compliance', 'standard', 'benchmark', 'milestone',
  'vision', 'aspiration', 'ethical-value', 'regulatory-constraint',
  'market-driver',
  // Other (7)
  'grouping', 'junction', 'data-object', 'material', 'artifact',
  'line-connection', 'note',
] as const as ArchiMateElementType[];

// ============================================================================
// PascalCase aliases for interop with Rust / existing APIs.
// ============================================================================
export const PASCAL_TO_KEBAB: Readonly<Record<string, string>> = Object.freeze({
  Capability: 'capability', Means: 'means', Outcome: 'outcome',
  ValueStream: 'value-stream', CourseOfAction: 'course-of-action',
  Stakeholder: 'stakeholder', Goal: 'goal', Constraint: 'constraint',
  Assessment: 'assessment', Value: 'value', Representation: 'representation',
  Resource: 'resource', CapabilityGroup: 'capability-group',
  StrategicGoal: 'strategic-goal', StrategicObjective: 'strategic-objective',
  BusinessCase: 'business-case', Initiative: 'initiative',
  Roadmap: 'roadmap', Portfolio: 'portfolio', Domain: 'domain',
  CapabilityMatrix: 'capability-matrix', ValueProposition: 'value-proposition',
  BusinessActor: 'business-actor', BusinessCollaboration: 'business-collaboration',
  BusinessEvent: 'business-event', BusinessFunction: 'business-function',
  BusinessInteraction: 'business-interaction', BusinessInterface: 'business-interface',
  BusinessObject: 'business-object', BusinessProcess: 'business-process',
  BusinessRole: 'business-role', BusinessService: 'business-service',
  BusinessLocation: 'business-location',
  ApplicationCollaboration: 'application-collaboration',
  ApplicationComponent: 'application-component', ApplicationEvent: 'application-event',
  ApplicationFunction: 'application-function',
  ApplicationInteraction: 'application-interaction',
  ApplicationInterface: 'application-interface',
  ApplicationProcess: 'application-process',
  ApplicationService: 'application-service',
  TechnologyCollaboration: 'technology-collaboration',
  TechnologyComponent: 'technology-component', TechnologyEvent: 'technology-event',
  TechnologyFunction: 'technology-function',
  TechnologyInteraction: 'technology-interaction',
  TechnologyInterface: 'technology-interface',
  TechnologyProcess: 'technology-process',
  TechnologyService: 'technology-service',
  Node: 'node', CommunicationNetwork: 'communication-network',
  Facility: 'facility', Equipment: 'equipment',
  SystemSoftware: 'system-software', CommunicationPath: 'communication-path',
  DistributionNetwork: 'distribution-network', Product: 'product',
  WorkPackage: 'work-package', Plateau: 'plateau', Gap: 'gap',
  Contract: 'contract', Deliverable: 'deliverable',
  ImplementationEvent: 'implementation-event',
  Driver: 'driver', Principle: 'principle', Requirement: 'requirement',
  Motive: 'motive', Objective: 'objective', Quality: 'quality',
  ValueDriver: 'value-driver', Dependency: 'dependency', Tradeoff: 'tradeoff',
  Concern: 'concern', Risk: 'risk', Opportunity: 'opportunity',
  Incentive: 'incentive', Compliance: 'compliance', Standard: 'standard',
  Benchmark: 'benchmark', Milestone: 'milestone', Vision: 'vision',
  Aspiration: 'aspiration', EthicalValue: 'ethical-value',
  RegulatoryConstraint: 'regulatory-constraint',
  MarketDriver: 'market-driver',
  Grouping: 'grouping', Junction: 'junction', DataObject: 'data-object',
  Material: 'material', Artifact: 'artifact',
  LineConnection: 'line-connection', Note: 'note',
});

/**
 * Normalize an element type string to kebab-case.
 */
export function normalizeElementType(type: string): string {
  const mapped = PASCAL_TO_KEBAB[type];
  if (mapped) return mapped;
  for (const t of ALL_ELEMENT_TYPES) {
    if (t === type) return type;
  }
  return type.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

// ============================================================================
// Element category classification (for mxGraph shape rendering)
// ============================================================================
export type ArchiMateCategory =
  | 'actor'
  | 'collaboration'
  | 'event'
  | 'function'
  | 'interaction'
  | 'interface'
  | 'object'
  | 'process'
  | 'service'
  | 'physical'
  | 'motivation'
  | 'implementation'
  | 'other';

export const CATEGORY_MAP: Readonly<Record<ArchiMateElementType, ArchiMateCategory>> = Object.freeze({
  'capability': 'object', 'means': 'object', 'outcome': 'motivation',
  'value-stream': 'process', 'course-of-action': 'process',
  'stakeholder': 'actor', 'goal': 'motivation', 'constraint': 'motivation',
  'assessment': 'motivation', 'value': 'motivation', 'representation': 'object',
  'resource': 'object', 'capability-group': 'collaboration',
  'strategic-goal': 'motivation', 'strategic-objective': 'motivation',
  'business-case': 'object', 'initiative': 'process', 'roadmap': 'process',
  'portfolio': 'collaboration', 'domain': 'collaboration',
  'capability-matrix': 'object', 'value-proposition': 'motivation',
  'business-actor': 'actor', 'business-collaboration': 'collaboration',
  'business-event': 'event', 'business-function': 'function',
  'business-interaction': 'interaction', 'business-interface': 'interface',
  'business-object': 'object', 'business-process': 'process',
  'business-role': 'actor', 'business-service': 'service',
  'business-location': 'physical',
  'application-collaboration': 'collaboration',
  'application-component': 'object', 'application-event': 'event',
  'application-function': 'function', 'application-interaction': 'interaction',
  'application-interface': 'interface', 'application-process': 'process',
  'application-service': 'service',
  'technology-collaboration': 'collaboration', 'technology-component': 'object',
  'technology-event': 'event', 'technology-function': 'function',
  'technology-interaction': 'interaction', 'technology-interface': 'interface',
  'technology-process': 'process', 'technology-service': 'service',
  'node': 'physical', 'communication-network': 'collaboration',
  'facility': 'physical', 'equipment': 'physical',
  'system-software': 'object', 'communication-path': 'other',
  'distribution-network': 'collaboration', 'product': 'object',
  'work-package': 'implementation', 'plateau': 'implementation',
  'gap': 'implementation', 'contract': 'implementation',
  'deliverable': 'implementation', 'implementation-event': 'event',
  'driver': 'motivation', 'principle': 'motivation',
  'requirement': 'motivation', 'motive': 'motivation',
  'objective': 'motivation', 'quality': 'motivation',
  'value-driver': 'motivation', 'dependency': 'motivation',
  'tradeoff': 'motivation', 'concern': 'motivation', 'risk': 'motivation',
  'opportunity': 'motivation', 'incentive': 'motivation',
  'compliance': 'motivation', 'standard': 'motivation',
  'benchmark': 'motivation', 'milestone': 'motivation',
  'vision': 'motivation', 'aspiration': 'motivation',
  'ethical-value': 'motivation', 'regulatory-constraint': 'motivation',
  'market-driver': 'motivation',
  'grouping': 'other', 'junction': 'other', 'data-object': 'object',
  'material': 'object', 'artifact': 'object', 'line-connection': 'other',
  'note': 'other',
});

// ============================================================================
// Type → Layer mapping
// ============================================================================
export const TYPE_LAYER_MAP: Readonly<Record<ArchiMateElementType, ArchiMateLayer>> = Object.freeze({
  'capability': 'strategy', 'means': 'strategy', 'outcome': 'strategy',
  'value-stream': 'strategy', 'course-of-action': 'strategy',
  'stakeholder': 'strategy', 'goal': 'strategy', 'constraint': 'strategy',
  'assessment': 'strategy', 'value': 'strategy', 'representation': 'strategy',
  'resource': 'strategy', 'capability-group': 'strategy',
  'strategic-goal': 'strategy', 'strategic-objective': 'strategy',
  'business-case': 'strategy', 'initiative': 'strategy', 'roadmap': 'strategy',
  'portfolio': 'strategy', 'domain': 'strategy', 'capability-matrix': 'strategy',
  'value-proposition': 'strategy',
  'business-actor': 'business', 'business-collaboration': 'business',
  'business-event': 'business', 'business-function': 'business',
  'business-interaction': 'business', 'business-interface': 'business',
  'business-object': 'business', 'business-process': 'business',
  'business-role': 'business', 'business-service': 'business',
  'business-location': 'business',
  'application-collaboration': 'application',
  'application-component': 'application', 'application-event': 'application',
  'application-function': 'application', 'application-interaction': 'application',
  'application-interface': 'application', 'application-process': 'application',
  'application-service': 'application',
  'technology-collaboration': 'technology', 'technology-component': 'technology',
  'technology-event': 'technology', 'technology-function': 'technology',
  'technology-interaction': 'technology', 'technology-interface': 'technology',
  'technology-process': 'technology', 'technology-service': 'technology',
  'node': 'technology', 'communication-network': 'technology',
  'facility': 'physical', 'equipment': 'physical',
  'system-software': 'physical', 'communication-path': 'physical',
  'distribution-network': 'physical', 'product': 'physical',
  'work-package': 'implementation', 'plateau': 'implementation',
  'gap': 'implementation', 'contract': 'implementation',
  'deliverable': 'implementation', 'implementation-event': 'implementation',
  'driver': 'motivation', 'principle': 'motivation',
  'requirement': 'motivation', 'motive': 'motivation',
  'objective': 'motivation', 'quality': 'motivation',
  'value-driver': 'motivation', 'dependency': 'motivation',
  'tradeoff': 'motivation', 'concern': 'motivation', 'risk': 'motivation',
  'opportunity': 'motivation', 'incentive': 'motivation',
  'compliance': 'motivation', 'standard': 'motivation',
  'benchmark': 'motivation', 'milestone': 'motivation',
  'vision': 'motivation', 'aspiration': 'motivation',
  'ethical-value': 'motivation', 'regulatory-constraint': 'motivation',
  'market-driver': 'motivation',
  'grouping': 'other', 'junction': 'other', 'data-object': 'other',
  'material': 'other', 'artifact': 'other', 'line-connection': 'other',
  'note': 'other',
});

// ============================================================================
// Layer color constants
// ============================================================================
export const LAYER_COLORS: Readonly<Record<ArchiMateLayer, string>> = Object.freeze({
  strategy: '#006633',
  business: '#009933',
  application: '#0066CC',
  technology: '#CC6600',
  physical: '#993399',
  implementation: '#FF6600',
  motivation: '#993300',
  other: '#666666',
});

// ============================================================================
// FOLDER HIERARCHY — maps each layer to its element type folders
// ============================================================================
export const FOLDER_HIERARCHY: Readonly<Record<ArchiMateLayer, readonly ArchiMateElementType[]>> = Object.freeze({
  strategy: STRATEGY_TYPES,
  business: BUSINESS_TYPES,
  application: APPLICATION_TYPES,
  technology: TECHNOLOGY_TYPES,
  physical: PHYSICAL_TYPES,
  implementation: IMPLEMENTATION_TYPES,
  motivation: MOTIVATION_TYPES,
  other: OTHER_TYPES,
});

// ============================================================================
// VIEWPOINTS REGISTRY — 20 viewpoints with element associations
// ============================================================================
export interface ViewpointDef {
  name: string;
  description: string;
  layers: ArchiMateLayer[];
  elementTypes: readonly string[];
}

export const VIEWPOINTS_REGISTRY: ReadonlyArray<ViewpointDef> = Object.freeze([
  { name: 'Business Context', description: 'Overview of business actors, roles, and their interactions.', layers: ['business'], elementTypes: [...BUSINESS_TYPES] as readonly string[] },
  { name: 'Business Process', description: 'Detailed business process model with events and objects.', layers: ['business'], elementTypes: ['business-process', 'business-event', 'business-object', 'business-interaction', 'business-function'] },
  { name: 'Business Service', description: 'Business services and the actors that provide/consume them.', layers: ['business'], elementTypes: ['business-service', 'business-actor', 'business-role', 'business-interface'] },
  { name: 'Application Context', description: 'Application components and their relationships.', layers: ['application'], elementTypes: [...APPLICATION_TYPES] as readonly string[] },
  { name: 'Application Service', description: 'Application services and their interfaces.', layers: ['application'], elementTypes: ['application-service', 'application-interface', 'application-process'] },
  { name: 'Technology Context', description: 'Technology infrastructure overview.', layers: ['technology'], elementTypes: [...TECHNOLOGY_TYPES] as readonly string[] },
  { name: 'Deployment', description: 'How application and technology components are deployed.', layers: ['application', 'technology'], elementTypes: ['application-component', 'node', 'communication-network'] },
  { name: 'Infrastructure', description: 'Physical infrastructure and network topology.', layers: ['technology', 'physical'], elementTypes: [...TECHNOLOGY_TYPES, ...PHYSICAL_TYPES] as readonly string[] },
  { name: 'Motivation', description: 'Goals, requirements, and drivers behind the architecture.', layers: ['motivation'], elementTypes: [...MOTIVATION_TYPES] as readonly string[] },
  { name: 'Strategy', description: 'Strategic capabilities, value streams, and courses of action.', layers: ['strategy'], elementTypes: [...STRATEGY_TYPES] as readonly string[] },
  { name: 'Implementation & Migration', description: 'Work packages, plateaus, and gaps for change management.', layers: ['implementation'], elementTypes: [...IMPLEMENTATION_TYPES] as readonly string[] },
  { name: 'Physical', description: 'Physical facilities, equipment, and distribution networks.', layers: ['physical'], elementTypes: [...PHYSICAL_TYPES] as readonly string[] },
  { name: 'Cross-Application', description: 'Interactions between application and business layers.', layers: ['application', 'business'], elementTypes: [...APPLICATION_TYPES, ...BUSINESS_TYPES] as readonly string[] },
  { name: 'Service-Oriented', description: 'Services across business, application, and technology layers.', layers: ['business', 'application', 'technology'], elementTypes: ['business-service', 'application-service', 'technology-service'] },
  { name: 'Data Flow', description: 'Information flow between business objects and application data.', layers: ['business', 'application', 'other'], elementTypes: ['business-object', 'data-object', 'application-component', 'application-process'] },
  { name: 'System-of-Systems', description: 'High-level system interactions across organizational boundaries.', layers: ['technology', 'application'], elementTypes: ['communication-network', 'node', 'application-collaboration'] },
  { name: 'Event-Driven', description: 'Events, triggers, and their relationships across layers.', layers: ['business', 'application', 'technology'], elementTypes: ['business-event', 'application-event', 'technology-event', 'business-process', 'application-process', 'technology-process'] },
  { name: 'Interface Design', description: 'Interfaces and their connections across architecture layers.', layers: ['business', 'application', 'technology'], elementTypes: ['business-interface', 'application-interface', 'technology-interface'] },
  { name: 'Collaboration', description: 'Collaboration patterns across business and technology domains.', layers: ['business', 'application', 'technology', 'physical'], elementTypes: ['business-collaboration', 'application-collaboration', 'technology-collaboration', 'communication-network', 'distribution-network'] },
  { name: 'Functional', description: 'Functional behavior across all layers.', layers: ['business', 'application', 'technology'], elementTypes: ['business-function', 'application-function', 'technology-function'] },
]);

// ============================================================================
// COMPATIBILITY MATRIX — relationship validation between element types
// ============================================================================
export interface CompatibilityRule {
  sources: readonly string[];
  targets: readonly string[];
}

export type CompatibilityMatrix = Readonly<Record<string, readonly CompatibilityRule[]>>;

export const COMPATIBILITY_MATRIX: CompatibilityMatrix = Object.freeze({
  access: [
    { sources: ['business-actor', 'business-role', 'application-component', 'node'], targets: ['business-object', 'application-component', 'artifact', 'data-object'] },
  ],
  serving: [
    { sources: ['business-service', 'application-service', 'technology-service'], targets: ['business-actor', 'business-role', 'business-service', 'application-service'] },
  ],
  realization: [
    { sources: ['business-function', 'application-function', 'technology-function'], targets: ['business-function', 'application-function', 'technology-function'] },
    { sources: ['application-component', 'technology-component'], targets: ['business-service', 'application-service'] },
  ],
  assignment: [
    { sources: ['business-actor', 'business-role'], targets: ['business-function', 'business-process', 'business-service'] },
  ],
  triggering: [
    { sources: ['business-event', 'application-event', 'technology-event'], targets: ['business-process', 'application-process', 'technology-process'] },
  ],
  flow: [
    { sources: ['business-object', 'application-component', 'data-object'], targets: ['business-object', 'application-component', 'data-object'] },
  ],
  structure: [
    { sources: ['business-collaboration', 'application-collaboration', 'technology-collaboration'], targets: ['*'] },
  ],
  aggregation: [
    { sources: ['*'], targets: ['*'] },
  ],
  association: [
    { sources: ['*'], targets: ['*'] },
  ],
  specialization: [
    { sources: ['*'], targets: ['*'] },
  ],
  composition: [
    { sources: ['node', 'facility'], targets: ['application-component', 'technology-component', 'artifact'] },
  ],
  conditional: [
    { sources: ['*'], targets: ['*'] },
  ],
  correlation: [
    { sources: ['*'], targets: ['*'] },
  ],
  influence: [
    { sources: ['goal', 'requirement', 'constraint', 'principle', 'value', 'driver'], targets: ['*'] },
  ],
});

/**
 * Check if a relationship type is compatible between two element types.
 */
export function isRelationshipCompatible(
  relationshipType: string,
  sourceType: string,
  targetType: string,
): boolean {
  const rules = COMPATIBILITY_MATRIX[relationshipType];
  if (!rules) return false;
  return rules.some(rule => {
    const sourceMatch = rule.sources.some(s => s === '*' || s === sourceType);
    const targetMatch = rule.targets.some(t => t === '*' || t === targetType);
    return sourceMatch && targetMatch;
  });
}

// ============================================================================
// Legacy PascalCase type aliases (for backward compatibility)
// ============================================================================
export type ElementType = ArchiMateElementType;
export type Layer = ArchiMateLayer;
export const LAYER_MAP: Readonly<Record<string, ArchiMateLayer>> = TYPE_LAYER_MAP;

// ============================================================================
// Count verification
// ============================================================================
export const TOTAL_ELEMENT_TYPES: number = ALL_ELEMENT_TYPES.length;

// ============================================================================
// Lowercase aliases for backward compatibility (matches web/src/types/archimate.ts)
// ============================================================================
export const allElementTypes = ALL_ELEMENT_TYPES;
export const uniqueElementTypes = ALL_ELEMENT_TYPES;
export const elementTypes = ALL_ELEMENT_TYPES;
// Alias for stores that reference ELEMENT_TYPE_TO_LAYER
export const ELEMENT_TYPE_TO_LAYER: Readonly<Record<ArchiMateElementType, ArchiMateLayer>> = TYPE_LAYER_MAP;
export const strategyTypes = STRATEGY_TYPES;
export const businessTypes = BUSINESS_TYPES;
export const applicationTypes = APPLICATION_TYPES;
export const technologyTypes = TECHNOLOGY_TYPES;
export const physicalTypes = PHYSICAL_TYPES;
export const implementationTypes = IMPLEMENTATION_TYPES;
export const motivationTypes = MOTIVATION_TYPES;
export const otherTypes = OTHER_TYPES;
