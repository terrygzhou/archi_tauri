import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ArchiMateElementType, ArchiMateLayer, ELEMENT_TYPE_TO_LAYER, ALL_ELEMENT_TYPES } from './archimate';
import { RelationshipType, ALL_RELATIONSHIP_TYPES } from './relationships';

// ============================================================================
// UUID type
// ============================================================================
export type UUID = string & { readonly __brand: 'UUID' };

// ============================================================================
// Base element schema (Zod)
// ============================================================================
export const BaseElementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(ALL_ELEMENT_TYPES as unknown as [ArchiMateElementType, ...ArchiMateElementType[]]),
  name: z.string().min(1, 'Name is required'),
  documentation: z.string().optional(),
  tags: z.array(z.string()).default([]),
  stereotypes: z.array(z.string()).default([]),
  properties: z.record(z.string(), z.unknown()).default({}),
  userProperties: z.record(z.string(), z.string()).default({}),
  layer: z.enum(['strategy', 'business', 'application', 'technology', 'physical', 'implementation', 'motivation', 'other'] as const),
  folderId: z.string().uuid().optional(),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  createdBy: z.string().email().optional(),
  version: z.number().int().nonnegative().default(1),
});

export type BaseElement = z.infer<typeof BaseElementSchema>;

// ============================================================================
// ArchiMate element schema
// ============================================================================
export const ArchiMateElementSchema = BaseElementSchema;
export type ArchiMateElement = z.infer<typeof ArchiMateElementSchema>;

// ============================================================================
// Relationship schema
// ============================================================================
export const AccessTypeSchema = z.enum(['READ', 'WRITE', 'READ_WRITE', 'UNSPECIFIED']);
export type AccessType = z.infer<typeof AccessTypeSchema>;

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().uuid(),
  type: z.enum(ALL_RELATIONSHIP_TYPES as unknown as [RelationshipType, ...RelationshipType[]]),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  name: z.string().optional(),
  documentation: z.string().optional(),
  accessType: AccessTypeSchema.optional(),
  sourceProperty: z.string().optional(),
  targetProperty: z.string().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

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
  name: z.string().min(1, 'Diagram name is required'),
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
// Folder schema (for model explorer tree)
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
// Model schema
// ============================================================================
export const ModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Model name is required'),
  version: z.string().default('1.0'),
  archimateVersion: z.string().default('3.1'),
  description: z.string().optional(),
  elements: z.array(ArchiMateElementSchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  diagrams: z.array(DiagramSchema).default([]),
  folders: z.array(FolderSchema).default([]),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  createdBy: z.string().email().optional(),
});

export type Model = z.infer<typeof ModelSchema>;

// ============================================================================
// Model factory — creates new instances with defaults
// ============================================================================
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
      version: 1,
      ...overrides,
    });
  }

  static createRelationship(
    type: RelationshipType,
    sourceId: string,
    targetId: string,
    modelId: string,
    overrides: Partial<Relationship> = {},
  ): Relationship {
    return RelationshipSchema.parse({
      id: uuidv4(),
      type,
      sourceId,
      targetId,
      modelId,
      ...overrides,
    });
  }

  static createDiagram(overrides: Partial<Diagram> = {}): Diagram {
    const now = new Date().toISOString();
    return DiagramSchema.parse({
      id: uuidv4(),
      modelId: uuidv4(),
      name: 'Untitled Diagram',
      documentation: '',
      gridSize: 10,
      gridVisible: true,
      gridSnap: true,
      backgroundColor: '#FFFFFF',
      elements: [],
      connections: [],
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

  // Validation helpers
  static isValidElementType(type: string): type is ArchiMateElementType {
    return [...ALL_ELEMENT_TYPES].includes(type as ArchiMateElementType);
  }

  static isValidRelationshipType(type: string): type is RelationshipType {
    return [...ALL_RELATIONSHIP_TYPES].includes(type as RelationshipType);
  }

  static createElementFromTypeString(type: string, overrides: Partial<ArchiMateElement> = {}): ArchiMateElement | null {
    if (!this.isValidElementType(type)) {
      return null;
    }
    return this.createElement(type as ArchiMateElementType, overrides);
  }
}
