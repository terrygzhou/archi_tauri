// ============================================================================
// ArchiMate Relationship Types — 14 types per ArchiMate 3.1
// ============================================================================

export type RelationshipType =
  | 'access'
  | 'serving'
  | 'realization'
  | 'assignment'
  | 'triggering'
  | 'flow'
  | 'structure'
  | 'aggregation'
  | 'association'
  | 'specialization'
  | 'composition'
  | 'conditional'
  | 'correlation'
  | 'influence';

export const ALL_RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'access',
  'serving',
  'realization',
  'assignment',
  'triggering',
  'flow',
  'structure',
  'aggregation',
  'association',
  'specialization',
  'composition',
  'conditional',
  'correlation',
  'influence',
];

// ============================================================================
// Relationship metadata
// ============================================================================
export interface RelationshipMeta {
  name: string;
  description: string;
  /** Arrowhead style for diagram rendering */
  arrowhead: 'none' | 'open' | 'filled' | 'diamond' | 'dot' | 'cross';
  /** Line style */
  lineStyle: 'solid' | 'dashed' | 'dotted';
  /** Whether the relationship can have a label */
  labeled: boolean;
}

export const RELATIONSHIP_META: Readonly<Record<string, RelationshipMeta>> = Object.freeze({
  access: {
    name: 'Access',
    description: 'An access relationship indicates that the source element requires or provides access to the target element.',
    arrowhead: 'open',
    lineStyle: 'dashed',
    labeled: true,
  },
  serving: {
    name: 'Serving',
    description: 'A serving relationship indicates that the source element supports the target element.',
    arrowhead: 'open',
    lineStyle: 'dashed',
    labeled: true,
  },
  realization: {
    name: 'Realization',
    description: 'A realization relationship indicates that the source element realizes the target element.',
    arrowhead: 'filled',
    lineStyle: 'solid',
    labeled: true,
  },
  assignment: {
    name: 'Assignment',
    description: 'An assignment relationship indicates that the source element assigns the target element to a role.',
    arrowhead: 'open',
    lineStyle: 'solid',
    labeled: true,
  },
  triggering: {
    name: 'Triggering',
    description: 'A triggering relationship indicates that the source element triggers the target element.',
    arrowhead: 'open',
    lineStyle: 'dashed',
    labeled: true,
  },
  flow: {
    name: 'Flow',
    description: 'A flow relationship indicates that objects or events flow from the source to the target.',
    arrowhead: 'open',
    lineStyle: 'solid',
    labeled: true,
  },
  structure: {
    name: 'Structure',
    description: 'A structure relationship indicates the internal structure of an element.',
    arrowhead: 'none',
    lineStyle: 'solid',
    labeled: false,
  },
  aggregation: {
    name: 'Aggregation',
    description: 'An aggregation relationship indicates that the source element is composed of the target element.',
    arrowhead: 'diamond',
    lineStyle: 'solid',
    labeled: false,
  },
  association: {
    name: 'Association',
    description: 'An association relationship indicates a general relationship between elements.',
    arrowhead: 'none',
    lineStyle: 'solid',
    labeled: true,
  },
  specialization: {
    name: 'Specialization',
    description: 'A specialization relationship indicates that the source element is a specialization of the target element.',
    arrowhead: 'filled',
    lineStyle: 'dashed',
    labeled: false,
  },
  composition: {
    name: 'Composition',
    description: 'A composition relationship indicates a strong ownership relationship between elements.',
    arrowhead: 'diamond',
    lineStyle: 'solid',
    labeled: false,
  },
  conditional: {
    name: 'Conditional',
    description: 'A conditional relationship indicates that a relationship is subject to a condition.',
    arrowhead: 'dot',
    lineStyle: 'dashed',
    labeled: true,
  },
  correlation: {
    name: 'Correlation',
    description: 'A correlation relationship indicates that elements are correlated.',
    arrowhead: 'cross',
    lineStyle: 'dotted',
    labeled: true,
  },
  influence: {
    name: 'Influence',
    description: 'An influence relationship indicates that the source element influences the target element.',
    arrowhead: 'open',
    lineStyle: 'dashed',
    labeled: true,
  },
});

// ============================================================================
// Compatible element types for each relationship
// ============================================================================
export type SourceTargetRule = {
  sources: string[];
  targets: string[];
};

export const RELATIONSHIP_COMPATIBILITY: Readonly<Record<string, SourceTargetRule[]>> = Object.freeze({
  access: [
    { sources: ['BusinessActor', 'BusinessRole', 'ApplicationComponent', 'Node'], targets: ['BusinessObject', 'ApplicationComponent', 'Artifact', 'DataObject'] },
  ],
  serving: [
    { sources: ['BusinessService', 'ApplicationService', 'TechnologyService'], targets: ['BusinessActor', 'BusinessRole', 'BusinessService', 'ApplicationService'] },
  ],
  realization: [
    { sources: ['BusinessFunction', 'ApplicationFunction', 'TechnologyFunction'], targets: ['BusinessFunction', 'ApplicationFunction', 'TechnologyFunction'] },
    { sources: ['ApplicationComponent', 'TechnologyComponent'], targets: ['BusinessService', 'ApplicationService'] },
  ],
  assignment: [
    { sources: ['BusinessActor', 'BusinessRole'], targets: ['BusinessFunction', 'BusinessProcess', 'BusinessService'] },
  ],
  triggering: [
    { sources: ['BusinessEvent', 'ApplicationEvent', 'TechnologyEvent'], targets: ['BusinessProcess', 'ApplicationProcess', 'TechnologyProcess'] },
  ],
  flow: [
    { sources: ['BusinessObject', 'ApplicationComponent', 'DataObject'], targets: ['BusinessObject', 'ApplicationComponent', 'DataObject'] },
  ],
  structure: [
    { sources: ['BusinessCollaboration', 'ApplicationCollaboration', 'TechnologyCollaboration'], targets: ['*'] },
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
    { sources: ['Node', 'Location'], targets: ['ApplicationComponent', 'TechnologyComponent', 'Artifact'] },
  ],
  conditional: [
    { sources: ['*'], targets: ['*'] },
  ],
  correlation: [
    { sources: ['*'], targets: ['*'] },
  ],
  influence: [
    { sources: ['Goal', 'Requirement', 'Constraint', 'Principle', 'Value', 'Driver'], targets: ['*'] },
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
  const rules = RELATIONSHIP_COMPATIBILITY[relationshipType];
  if (!rules) return false;

  return rules.some(rule => {
    const sourceMatch = rule.sources.includes('*') || rule.sources.includes(sourceType);
    const targetMatch = rule.targets.includes('*') || rule.targets.includes(targetType);
    return sourceMatch && targetMatch;
  });
}
