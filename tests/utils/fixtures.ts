/**
 * Test fixtures — reusable test data for unit and E2E tests.
 */

import { v4 as uuidv4 } from 'uuid';

// Re-export for tests that need valid UUIDs
export { uuidv4 };
import {
  ArchiMateElement,
  Relationship,
  Diagram,
  Model,
} from '../../src/types/domain';
import {
  ArchiMateElementType,
  ArchiMateLayer,
  TYPE_LAYER_MAP,
} from '../../src/types/archimate';
import { RelationshipType } from '../../src/types/relationships';

// ── Helper: deterministic UUID for reproducible tests ──────────────────────
const counter = { n: 0 };
export function makeId(prefix = 'test'): string {
  counter.n += 1;
  // Generates a valid UUID v4 format
  return `${prefix}-${String(counter.n).padStart(4, '0')}-${padHex(1, 4)}-${padHex(2, 4)}-${padHex(3, 4)}-${padHex(4, 12)}`;
}

function padHex(slot: number, len: number): string {
  const val = ((counter.n * (slot + 1) * 17)) & 0xffffffff;
  return val.toString(16).padStart(len, '0').slice(0, len);
}

// ── Default timestamp ──────────────────────────────────────────────────────
export const NOW = new Date('2025-01-01T00:00:00.000Z').toISOString();

// ── Element factories ──────────────────────────────────────────────────────
export function createElement(
  type: ArchiMateElementType,
  overrides: Partial<ArchiMateElement> = {},
): ArchiMateElement {
  const id = overrides.id || makeId('elem');
  const layer = TYPE_LAYER_MAP[type] || 'other';
  return {
    id,
    type,
    name: overrides.name || `${type} ${counter.n}`,
    documentation: '',
    tags: [],
    stereotypes: [],
    properties: {},
    userProperties: {},
    layer,
    folderId: null,
    created: NOW,
    modified: NOW,
    ...overrides,
  };
}

// ── Relationship factory ───────────────────────────────────────────────────
export function createRelationship(
  type: RelationshipType,
  overrides: Partial<Relationship> = {},
): Relationship {
  const sourceId = overrides.sourceId || makeId('src');
  const targetId = overrides.targetId || makeId('tgt');
  return {
    id: overrides.id || makeId('rel'),
    type,
    sourceId,
    targetId,
    modelId: overrides.modelId || makeId('model'),
    name: '',
    documentation: '',
    ...overrides,
  };
}

// ── Diagram factory ────────────────────────────────────────────────────────
export function createDiagram(
  name: string,
  modelId: string,
  overrides: Partial<Diagram> = {},
): Diagram {
  return {
    id: overrides.id || makeId('diag'),
    name,
    modelId,
    width: 1200,
    height: 800,
    gridSize: 10,
    layout: {},
    created: NOW,
    modified: NOW,
    ...overrides,
  };
}

// ── Model factory ───────────────────────────────────────────────────────────
export function createModel(
  name: string,
  overrides: Partial<Model> = {},
): Model {
  const id = overrides.id || makeId('model');
  return {
    id,
    name,
    version: '1.0.0',
    archimateVersion: '3.2',
    description: '',
    elements: [],
    relationships: [],
    diagrams: [],
    created: NOW,
    modified: NOW,
    ...overrides,
  };
}

// ── Sample model for round-trip tests ───────────────────────────────────────
export function createSampleModel(): Model {
  const modelId = uuidv4();
  const actor = uuidv4();
  const process = uuidv4();
  const service = uuidv4();

  const actorEl: ArchiMateElement = {
    id: actor,
    type: 'business-actor',
    name: 'Customer',
    documentation: '',
    tags: [],
    stereotypes: [],
    properties: {},
    userProperties: {},
    layer: 'business',
    modelId: modelId,
    created: NOW,
    modified: NOW,
  };

  const processEl: ArchiMateElement = {
    id: process,
    type: 'business-process',
    name: 'Order Processing',
    documentation: '',
    tags: [],
    stereotypes: [],
    properties: {},
    userProperties: {},
    layer: 'business',
    modelId: modelId,
    created: NOW,
    modified: NOW,
  };

  const serviceEl: ArchiMateElement = {
    id: service,
    type: 'business-service',
    name: 'API Gateway',
    documentation: '',
    tags: [],
    stereotypes: [],
    properties: {},
    userProperties: {},
    layer: 'business',
    modelId: modelId,
    created: NOW,
    modified: NOW,
  };

  const rel1: Relationship = {
    id: uuidv4(),
    type: 'assignment',
    sourceId: actor,
    targetId: process,
    modelId: modelId,
    name: '',
    documentation: '',
  };

  const rel2: Relationship = {
    id: uuidv4(),
    type: 'access',
    sourceId: process,
    targetId: service,
    modelId: modelId,
    name: '',
    documentation: '',
  };

  const diagram: Diagram = {
    id: uuidv4(),
    name: 'Main',
    modelId,
    width: 1200,
    height: 800,
    gridSize: 10,
    layout: {},
    created: NOW,
    modified: NOW,
  };

  return {
    id: modelId,
    name: 'Sample Model',
    version: '1.0.0',
    archimateVersion: '3.2',
    description: '',
    elements: [actorEl, processEl, serviceEl],
    relationships: [rel1, rel2],
    diagrams: [diagram],
    created: NOW,
    modified: NOW,
  };
}

// ── Invalid element for negative tests ─────────────────────────────────────
export function createInvalidElement(): Record<string, unknown> {
  return {
    id: 'not-a-valid-uuid',
    type: 'InvalidElementType',
    name: '',
    layer: 'invalid_layer',
    created: 'not-a-date',
    modified: 'not-a-date',
  };
}

// ── All element types for enumeration tests ────────────────────────────────
export const TEST_TYPES: ArchiMateElementType[] = [
  'capability',
  'resource',
  'value-stream',
  'business-actor',
  'business-collaboration',
  'business-event',
  'business-function',
  'business-interaction',
  'business-interface',
  'business-object',
  'business-process',
  'business-role',
  'business-service',
  'business-location',
  'application-collaboration',
  'application-component',
  'application-event',
  'application-function',
  'application-interaction',
  'application-interface',
  'application-process',
  'application-service',
  'technology-collaboration',
  'technology-component',
  'technology-event',
  'technology-function',
  'technology-interaction',
  'technology-interface',
  'technology-process',
  'technology-service',
  'node',
  'communication-network',
  'facility',
  'equipment',
  'system-software',
  'communication-path',
  'distribution-network',
  'product',
  'work-package',
  'plateau',
  'gap',
  'contract',
  'deliverable',
  'implementation-event',
  'representation',
  'means',
  'stakeholder',
  'driver',
  'goal',
  'requirement',
  'constraint',
  'principle',
  'assessment',
  'outcome',
  'value',
  'course-of-action',
  'grouping',
  'junction',
  'data-object',
  'material',
  'artifact',
  'line-connection',
  'note',
];
