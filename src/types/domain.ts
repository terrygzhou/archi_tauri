import { z } from 'zod';
import {
  ArchiMateElementType,
  ArchiMateLayer,
  ALL_ELEMENT_TYPES,
  ELEMENT_TYPE_TO_LAYER,
} from './archimate';
import { RelationshipType } from './relationships';

// ============================================================================
// UUID validation
// ============================================================================
export const uuidSchema = z.string().uuid();

// ============================================================================
// Base element schema
// ============================================================================
export const BaseElementSchema = z.object({
  id: uuidSchema,
  type: z.enum(ALL_ELEMENT_TYPES as [ArchiMateElementType, ...ArchiMateElementType[]]),
  name: z.string().min(1),
  documentation: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  stereotypes: z.array(z.string()).optional().default([]),
  properties: z.record(z.string(), z.any()).optional().default({}),
  userProperties: z.record(z.string(), z.string()).optional().default({}),
  layer: z.enum(['strategy', 'business', 'application', 'technology', 'physical', 'implementation', 'motivation', 'other'] as [ArchiMateLayer, ...ArchiMateLayer[]]),
  folderId: z.string().optional(),
  created: z.string().datetime(),
  modified: z.string().datetime(),
});

export type BaseElement = z.infer<typeof BaseElementSchema>;

// ============================================================================
// ArchiMate element schema (extends BaseElement with modelId)
// ============================================================================
export const ArchiMateElementSchema = BaseElementSchema.extend({
  modelId: uuidSchema.optional(),
});

export type ArchiMateElement = z.infer<typeof ArchiMateElementSchema>;

// ============================================================================
// Diagram element schema (position/sizing for canvas)
// ============================================================================
export const DiagramElementSchema = z.object({
  id: z.string().uuid(),
  elementId: z.string().uuid(),
  diagramId: z.string().uuid(),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(100),
  height: z.number().default(50),
  rotation: z.number().default(0),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  zIndex: z.number().int().nonnegative().default(0),
  customStyle: z.record(z.string(), z.unknown()).default({}),
});

export type DiagramElement = z.infer<typeof DiagramElementSchema>;

// ============================================================================
// Diagram connection schema
// ============================================================================
export const DiagramConnectionSchema = z.object({
  id: z.string().uuid(),
  relationshipId: z.string().uuid(),
  diagramId: z.string().uuid(),
  sourceElementId: z.string().uuid(),
  targetElementId: z.string().uuid(),
  waypoints: z.tuple([z.number(), z.number()]).array().default([]),
  style: z.record(z.string(), z.unknown()).default({}),
});

export type DiagramConnection = z.infer<typeof DiagramConnectionSchema>;

// ============================================================================
// Diagram schema
// ============================================================================
export const DiagramSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().uuid(),
  name: z.string().min(1),
  documentation: z.string().optional(),
  viewpoint: z.string().optional(),
  gridSize: z.number().positive().default(10),
  gridVisible: z.boolean().default(true),
  gridSnap: z.boolean().default(true),
  backgroundColor: z.string().default('#FFFFFF'),
  elements: z.array(DiagramElementSchema).default([]),
  connections: z.array(DiagramConnectionSchema).default([]),
  created: z.string().datetime(),
  modified: z.string().datetime(),
});

export type Diagram = z.infer<typeof DiagramSchema>;

// ============================================================================
// Folder schema
// ============================================================================
export const FolderSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().uuid(),
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  archived: z.boolean().default(false),
  elementIds: z.array(z.string().uuid()).default([]),
  childFolderIds: z.array(z.string().uuid()).default([]),
  created: z.string().datetime(),
  modified: z.string().datetime(),
});

export type Folder = z.infer<typeof FolderSchema>;

// ============================================================================
// Relationship type schema
// ============================================================================
export const RelationshipSchema = z.object({
  id: uuidSchema,
  modelId: uuidSchema.optional(),
  type: z.enum([
    'access', 'serving', 'realization', 'assignment',
    'triggering', 'flow', 'structure', 'aggregation',
    'association', 'specialization', 'composition',
    'conditional', 'correlation', 'influence',
  ]),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  name: z.string().optional(),
  documentation: z.string().optional(),
  accessType: z.enum(['read', 'write', 'execute']).optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

// ============================================================================
// Model schema
// ============================================================================
export const ModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.string(),
  archimateVersion: z.string(),
  description: z.string().optional(),
  elements: z.array(ArchiMateElementSchema).optional().default([]),
  relationships: z.array(RelationshipSchema).optional().default([]),
  diagrams: z.array(DiagramSchema).optional().default([]),
  folders: z.array(FolderSchema).optional().default([]),
  created: z.string().datetime(),
  modified: z.string().datetime(),
});

export type Model = z.infer<typeof ModelSchema>;

// ============================================================================
// ModelExport schema — used by ArchiSerializer (.archi format)
// ============================================================================
export const ModelExportSchema = ModelSchema.extend({
  format: z.string(),
  formatVersion: z.string(),
});

export type ModelExport = z.infer<typeof ModelExportSchema>;

// ============================================================================
// Full archi model schema
// ============================================================================
export const ArchiModelSchema = z.object({
  models: z.array(ModelSchema),
});

export type ArchiModel = z.infer<typeof ArchiModelSchema>;

// ============================================================================
// Open ArchiMate Exchange schema
// ============================================================================
export const OpenArchimateModelSchema = z.object({
  model: z.object({
    id: z.string().optional(),
    name: z.string(),
    archimateVersion: z.string(),
    description: z.string().optional().default(''),
    author: z.string().optional().default(''),
    created: z.string().optional(),
    modified: z.string().optional(),
  }),
  elements: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    documentation: z.string().optional().default(''),
    tags: z.string().optional().default(''),
    properties: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional().default([]),
  })).optional().default([]),
  relationships: z.array(z.object({
    id: z.string(),
    type: z.string(),
    source: z.string(),
    target: z.string(),
    name: z.string().optional().default(''),
    documentation: z.string().optional().default(''),
  })).optional().default([]),
  diagrams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    cells: z.any().optional().default({}),
  })).optional().default([]),
});

export type OpenArchimateModel = z.infer<typeof OpenArchimateModelSchema>;

// ============================================================================
// Model factory
// ============================================================================
import { v4 as uuidv4 } from 'uuid';

export class ModelFactory {
  static createModel(overrides: Partial<Model> = {}): Model {
    const now = new Date().toISOString();
    return ModelSchema.parse({
      id: uuidv4(),
      name: 'Untitled Model',
      version: '1.0',
      archimateVersion: '3.1',
      description: '',
      elements: [],
      relationships: [],
      diagrams: [],
      folders: [],
      created: now,
      modified: now,
      ...overrides,
    });
  }

  static createElement(type: ArchiMateElementType, overrides: Partial<ArchiMateElement> = {}): ArchiMateElement {
    const layer = ELEMENT_TYPE_TO_LAYER[type] ?? 'other';
    const now = new Date().toISOString();
    return ArchiMateElementSchema.parse({
      id: uuidv4(),
      type,
      name: type,
      documentation: '',
      tags: [],
      stereotypes: [],
      properties: {},
      userProperties: {},
      layer,
      created: now,
      modified: now,
      ...overrides,
    });
  }

  static createDiagramElement(
    elementId: string,
    diagramId: string,
    overrides: Partial<DiagramElement> = {},
  ): DiagramElement {
    return DiagramElementSchema.parse({
      id: uuidv4(),
      elementId,
      diagramId,
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 0,
      customStyle: {},
      ...overrides,
    });
  }

  static createConnection(
    relationshipId: string,
    diagramId: string,
    sourceElementId: string,
    targetElementId: string,
    overrides: Partial<DiagramConnection> = {},
  ): DiagramConnection {
    return DiagramConnectionSchema.parse({
      id: uuidv4(),
      relationshipId,
      diagramId,
      sourceElementId,
      targetElementId,
      waypoints: [],
      style: {},
      ...overrides,
    });
  }

  static createFolder(overrides: Partial<Folder> = {}): Folder {
    const now = new Date().toISOString();
    return FolderSchema.parse({
      id: uuidv4(),
      modelId: uuidv4(),
      name: 'New Folder',
      archived: false,
      elementIds: [],
      childFolderIds: [],
      created: now,
      modified: now,
      ...overrides,
    });
  }
}
