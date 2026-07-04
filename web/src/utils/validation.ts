import { z } from 'zod';
import {
  ArchiMateElementSchema,
  RelationshipSchema,
  DiagramElementSchema,
  ModelSchema,
  type ArchiMateElement,
  type Relationship,
  type DiagramElement,
  type Model,
} from '../types/domain';
import { ALL_ELEMENT_TYPES, ELEMENT_TYPE_TO_LAYER } from '../types/archimate';

// ============================================================================
// Validation result types
// ============================================================================
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  path: string;
}

// ============================================================================
// Validate ArchiMate element
// ============================================================================
export function validateElement(element: unknown): ValidationResult {
  try {
    ArchiMateElementSchema.parse(element);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        path: issue.path.join('.'),
      }));
      return { valid: false, errors };
    }
    return { valid: false, errors: [{ field: 'root', message: String(error), path: '' }] };
  }
}

// ============================================================================
// Validate relationship
// ============================================================================
export function validateRelationship(relationship: unknown): ValidationResult {
  try {
    RelationshipSchema.parse(relationship);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        path: issue.path.join('.'),
      }));
      return { valid: false, errors };
    }
    return { valid: false, errors: [{ field: 'root', message: String(error), path: '' }] };
  }
}

// ============================================================================
// Validate diagram element
// ============================================================================
export function validateDiagramElement(element: unknown): ValidationResult {
  try {
    DiagramElementSchema.parse(element);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        path: issue.path.join('.'),
      }));
      return { valid: false, errors };
    }
    return { valid: false, errors: [{ field: 'root', message: String(error), path: '' }] };
  }
}

// ============================================================================
// Validate complete model
// ============================================================================
export function validateModel(model: unknown): ValidationResult {
  try {
    ModelSchema.parse(model);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        path: issue.path.join('.'),
      }));
      return { valid: false, errors };
    }
    return { valid: false, errors: [{ field: 'root', message: String(error), path: '' }] };
  }
}

// ============================================================================
// Semantic validation (beyond schema — checks business rules)
// ============================================================================
export function validateElementSemantics(element: ArchiMateElement): ValidationResult {
  const errors: ValidationError[] = [];

  // Name cannot be just whitespace
  if (element.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name cannot be empty', path: 'name' });
  }

  // Name length check
  if (element.name.length > 255) {
    errors.push({ field: 'name', message: 'Name cannot exceed 255 characters', path: 'name' });
  }

  // Tags must be unique
  const tagSet = new Set(element.tags);
  if (tagSet.size !== element.tags.length) {
    errors.push({ field: 'tags', message: 'Tags must be unique', path: 'tags' });
  }

  // Stereotypes must be unique
  const stereoSet = new Set(element.stereotypes);
  if (stereoSet.size !== element.stereotypes.length) {
    errors.push({ field: 'stereotypes', message: 'Stereotypes must be unique', path: 'stereotypes' });
  }

  // Version must be positive
  if (element.version <= 0) {
    errors.push({ field: 'version', message: 'Version must be positive', path: 'version' });
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Validate element type belongs to correct layer
// ============================================================================
export function validateTypeLayerMatch(element: ArchiMateElement): ValidationResult {
  const expectedLayer = ELEMENT_TYPE_TO_LAYER[element.type];
  if (expectedLayer && element.layer !== expectedLayer) {
    return {
      valid: false,
      errors: [{
        field: 'layer',
        message: `Type '${element.type}' should belong to '${expectedLayer}' layer, not '${element.layer}'`,
        path: 'layer',
      }],
    };
  }
  return { valid: true, errors: [] };
}

// ============================================================================
// Validate element type exists
// ============================================================================
export function isValidElementType(type: string): boolean {
  return (ALL_ELEMENT_TYPES as readonly string[]).includes(type);
}

// ============================================================================
// Sanitize user input for element name
// ============================================================================
export function sanitizeElementName(name: string): string {
  return name.trim().replace(/<[^>]*>/g, '').substring(0, 255);
}

// ============================================================================
// Validate that all referenced IDs exist in the model
// ============================================================================
export function validateReferences(model: Model): ValidationResult {
  const errors: ValidationError[] = [];
  const elementIds = new Set(model.elements.map(e => e.id));
  const diagramIds = new Set(model.diagrams.map(d => d.id));

  // Check relationships reference valid elements
  for (const rel of model.relationships) {
    if (!elementIds.has(rel.sourceId)) {
      errors.push({
        field: 'relationships',
        message: `Relationship ${rel.id} references missing source element ${rel.sourceId}`,
        path: `relationships.${rel.id}.sourceId`,
      });
    }
    if (!elementIds.has(rel.targetId)) {
      errors.push({
        field: 'relationships',
        message: `Relationship ${rel.id} references missing target element ${rel.targetId}`,
        path: `relationships.${rel.id}.targetId`,
      });
    }
  }

  // Check diagram elements reference valid model elements
  for (const diagram of model.diagrams) {
    for (const de of diagram.elements) {
      if (!elementIds.has(de.elementId)) {
        errors.push({
          field: 'diagrams',
          message: `Diagram element ${de.id} in diagram ${diagram.id} references missing element ${de.elementId}`,
          path: `diagrams.${diagram.id}.elements.${de.id}.elementId`,
        });
      }
    }
  }

  // Check folder references
  for (const folder of model.folders) {
    for (const eid of folder.elementIds) {
      if (!elementIds.has(eid)) {
        errors.push({
          field: 'folders',
          message: `Folder ${folder.id} references missing element ${eid}`,
          path: `folders.${folder.id}.elementIds`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
