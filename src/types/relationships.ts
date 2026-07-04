/**
 * Relationship types and compatibility matrix.
 * 14 relationship types from the ArchiMate 3.2 specification.
 */

import { z } from 'zod';
import {
  elementTypes,
  uniqueElementTypes,
  ArchiMateLayer,
  LAYER_MAP,
  strategyTypes,
  businessTypes,
  applicationTypes,
  technologyTypes,
  physicalTypes,
  implementationTypes,
  motivationTypes,
  otherTypes,
} from './archimate';

// ── Relationship types ──────────────────────────────────────────────────────
export const relationshipTypes = [
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
] as const;

export const ALL_RELATIONSHIP_TYPES: readonly string[] = relationshipTypes;

export type RelationshipType = typeof relationshipTypes[number];

export const ACCESS_TYPES = ['READ', 'WRITE', 'READ_WRITE', 'UNSPECIFIED'] as const;
export type AccessType = typeof ACCESS_TYPES[number];

// ── Compatibility matrix ────────────────────────────────────────────────────
// Source → allowed relationship types
export const COMPATIBILITY_MATRIX: Record<string, string[]> = {
  BusinessActor: ['assignment', 'association', 'specialization', 'serving', 'realization', 'triggering', 'flow', 'aggregation', 'composition', 'correlation', 'influence'],
  BusinessProcess: ['access', 'serving', 'realization', 'assignment', 'triggering', 'flow', 'aggregation', 'association', 'specialization', 'composition', 'correlation', 'influence'],
  BusinessService: ['serving', 'realization', 'triggering', 'flow', 'association', 'specialization', 'aggregation', 'composition', 'correlation', 'influence'],
  ApplicationComponent: ['access', 'serving', 'realization', 'assignment', 'triggering', 'flow', 'aggregation', 'association', 'specialization', 'composition', 'correlation', 'influence'],
  ApplicationService: ['serving', 'realization', 'triggering', 'flow', 'association', 'specialization', 'aggregation', 'composition', 'correlation', 'influence'],
  Node: ['access', 'serving', 'realization', 'assignment', 'triggering', 'flow', 'aggregation', 'association', 'specialization', 'composition', 'correlation', 'influence'],
  Product: ['association', 'specialization', 'aggregation', 'composition', 'access', 'flow', 'influence', 'correlation'],
  Goal: ['association', 'specialization', 'aggregation', 'composition', 'realization', 'influence', 'correlation'],
  Requirement: ['association', 'specialization', 'aggregation', 'composition', 'realization', 'influence', 'correlation'],
  // Default for types not explicitly listed
};

/**
 * Check if a relationship type is valid between source and target elements.
 */
export function isRelationshipCompatible(
  relType: RelationshipType,
  sourceType: string,
  targetType: string,
): boolean {
  // Use source type compatibility first, then target type
  const sourceAllowed = COMPATIBILITY_MATRIX[sourceType];
  const targetAllowed = COMPATIBILITY_MATRIX[targetType];

  // If either side is in the matrix, check it
  if (sourceAllowed && sourceAllowed.includes(relType)) return true;
  if (targetAllowed && targetAllowed.includes(relType)) return true;

  // Default: relationship is compatible if it exists in the type system
  return relationshipTypes.includes(relType);
}

// ── Layer color palette ─────────────────────────────────────────────────────
export const LAYER_COLORS: Record<ArchiMateLayer, string> = {
  strategy: '#006633',
  business: '#009933',
  application: '#0066CC',
  technology: '#CC6600',
  physical: '#993399',
  implementation: '#FF6600',
  motivation: '#993300',
  other: '#666666',
};

// ── Folder hierarchy (mirrors the Archi left sidebar) ──────────────────────
export const FOLDER_HIERARCHY = {
  strategy: strategyTypes,
  business: businessTypes,
  application: applicationTypes,
  technology: technologyTypes,
  physical: physicalTypes,
  implementation: implementationTypes,
  motivation: motivationTypes,
  other: otherTypes,
} as const;

// ── RELATIONSHIP_META — metadata map for each relationship type ────────────
export const RELATIONSHIP_META: Record<string, { label: string; icon: string; color: string }> = {
  access: { label: 'Access', icon: 'access', color: '#666666' },
  serving: { label: 'Serving', icon: 'serving', color: '#0066CC' },
  realization: { label: 'Realization', icon: 'realization', color: '#009933' },
  assignment: { label: 'Assignment', icon: 'assignment', color: '#CC6600' },
  triggering: { label: 'Triggering', icon: 'triggering', color: '#CC0000' },
  flow: { label: 'Flow', icon: 'flow', color: '#0099CC' },
  structure: { label: 'Structure', icon: 'structure', color: '#993399' },
  aggregation: { label: 'Aggregation', icon: 'aggregation', color: '#336699' },
  association: { label: 'Association', icon: 'association', color: '#666666' },
  specialization: { label: 'Specialization', icon: 'specialization', color: '#996633' },
  composition: { label: 'Composition', icon: 'composition', color: '#663399' },
  conditional: { label: 'Conditional', icon: 'conditional', color: '#336633' },
  correlation: { label: 'Correlation', icon: 'correlation', color: '#333399' },
  influence: { label: 'Influence', icon: 'influence', color: '#993333' },
};

// Alias used by diagram module
export const RELATIONSHIP_COMPATIBILITY = COMPATIBILITY_MATRIX;
