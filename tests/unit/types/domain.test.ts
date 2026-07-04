import {
  ArchiMateElementSchema,
  RelationshipSchema,
  DiagramSchema,
  ModelSchema,
  BaseElementSchema,
} from '../../../src/types/domain';
import { ALL_ELEMENT_TYPES } from '../../../src/types/archimate';
import { v4 as uuidv4 } from 'uuid';

describe('Zod domain schemas', () => {
  const testId = uuidv4();
  const modelId = uuidv4();
  const sourceId = uuidv4();
  const targetId = uuidv4();

  const validElement = {
    id: testId,
    type: 'business-process' as const,
    name: 'Test Process',
    modelId,
    layer: 'business' as const,
    documentation: '',
    tags: [],
    stereotypes: [],
    properties: {},
    userProperties: {},
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  const validRelationship = {
    id: testId,
    type: 'association' as const,
    sourceId,
    targetId,
    modelId,
    name: '',
    documentation: '',
  };

  const validDiagram = {
    id: testId,
    name: 'Test Diagram',
    modelId,
    height: 600,
    width: 800,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  const validModel = {
    id: modelId,
    name: 'Test Model',
    version: '1.0.0',
    archimateVersion: '3.2',
    description: '',
    elements: [],
    relationships: [],
    diagrams: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  describe('BaseElementSchema', () => {
    it('validates a complete element', () => {
      const result = ArchiMateElementSchema.safeParse(validElement);
      expect(result.success).toBe(true);
    });

    it('rejects element without id', () => {
      const result = ArchiMateElementSchema.safeParse({
        ...validElement,
        id: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('rejects element without type', () => {
      const result = ArchiMateElementSchema.safeParse({
        ...validElement,
        type: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('rejects element without name', () => {
      const result = ArchiMateElementSchema.safeParse({
        ...validElement,
        name: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('rejects element without layer', () => {
      const result = ArchiMateElementSchema.safeParse({
        ...validElement,
        layer: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('allows optional fields to be omitted', () => {
      const minimalElement = {
        id: uuidv4(),
        type: 'business-process' as const,
        name: 'Minimal',
        layer: 'business' as const,
        modelId: uuidv4(),
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      const result = ArchiMateElementSchema.safeParse(minimalElement);
      expect(result.success).toBe(true);
    });

    it('validates all 92 ArchiMate element types', () => {
      for (const type of ALL_ELEMENT_TYPES) {
        const element = {
          ...validElement,
          id: uuidv4(),
          type,
          name: `${type} instance`,
        };
        const result = ArchiMateElementSchema.safeParse(element);
        expect(result.success).toBe(true);
      }
    });

    it('rejects unknown element type', () => {
      const result = ArchiMateElementSchema.safeParse({
        ...validElement,
        type: 'not-a-real-type' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RelationshipSchema', () => {
    it('validates a complete relationship', () => {
      const result = RelationshipSchema.safeParse(validRelationship);
      expect(result.success).toBe(true);
    });

    it('rejects relationship without sourceId', () => {
      const result = RelationshipSchema.safeParse({
        ...validRelationship,
        sourceId: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('rejects relationship without targetId', () => {
      const result = RelationshipSchema.safeParse({
        ...validRelationship,
        targetId: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('validates all relationship types', () => {
      const types = [
        'access', 'aggregation', 'association', 'assignment', 'conditional',
        'composition', 'correlation', 'flow', 'influence', 'realization',
        'serving', 'specialization', 'structure', 'triggering',
      ];

      for (const type of types) {
        const rel = {
          ...validRelationship,
          id: uuidv4(),
          type,
        };
        const result = RelationshipSchema.safeParse(rel);
        expect(result.success).toBe(true);
      }
    });

    it('validates access relationship with accessType', () => {
      const result = RelationshipSchema.safeParse({
        ...validRelationship,
        type: 'access' as const,
        accessType: 'read',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('DiagramSchema', () => {
    it('validates a complete diagram', () => {
      const result = DiagramSchema.safeParse(validDiagram);
      expect(result.success).toBe(true);
    });

    it('rejects diagram without name', () => {
      const result = DiagramSchema.safeParse({
        ...validDiagram,
        name: undefined,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ModelSchema', () => {
    it('validates a complete model', () => {
      const result = ModelSchema.safeParse(validModel);
      expect(result.success).toBe(true);
    });

    it('rejects model without name', () => {
      const result = ModelSchema.safeParse({
        ...validModel,
        name: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('validates model with elements', () => {
      const model = {
        ...validModel,
        elements: [validElement],
      };
      const result = ModelSchema.safeParse(model);
      expect(result.success).toBe(true);
    });

    it('validates model with relationships', () => {
      const model = {
        ...validModel,
        relationships: [validRelationship],
      };
      const result = ModelSchema.safeParse(model);
      expect(result.success).toBe(true);
    });

    it('validates model with diagrams', () => {
      const model = {
        ...validModel,
        diagrams: [validDiagram],
      };
      const result = ModelSchema.safeParse(model);
      expect(result.success).toBe(true);
    });

    it('validates model with all components', () => {
      const model = {
        ...validModel,
        elements: [validElement],
        relationships: [validRelationship],
        diagrams: [validDiagram],
      };
      const result = ModelSchema.safeParse(model);
      expect(result.success).toBe(true);
    });
  });
});
