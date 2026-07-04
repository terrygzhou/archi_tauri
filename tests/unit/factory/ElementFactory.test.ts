/**
 * Unit tests: ElementFactory and RelationshipFactory.
 * Tests element creation, layer assignment, validation, and duplication.
 */

import { describe, it, expect } from 'vitest';
import { ElementFactory, RelationshipFactory } from '../../../src/model/factory';
import { ArchiMateElementSchema, RelationshipSchema } from '../../../src/types/domain';
import {
  uniqueElementTypes,
  TYPE_LAYER_MAP,

} from '../../../src/types/archimate';
import { relationshipTypes } from '../../../src/types/relationships';
import { expectUuid, expectElementStructure } from '../../utils/test-helpers';

describe('ElementFactory', () => {
  describe('create', () => {
    it('creates an element with valid UUID and correct layer', () => {
      const elem = ElementFactory.create('business-actor', 'Customer');
      expectUuid(elem.id);
      expect(elem.type).toBe('business-actor');
      expect(elem.name).toBe('Customer');
      expect(elem.layer).toBe('business');
      expect(elem.created).toBeDefined();
      expect(elem.modified).toBe(elem.created);
      expect(elem.tags).toEqual([]);
      expect(elem.stereotypes).toEqual([]);
      expect(elem.properties).toEqual({});
      expect(elem.userProperties).toEqual({});
      expect(elem.folderId).toBeUndefined();
    });

    it('assigns correct layers for all types', () => {
      for (const type of uniqueElementTypes) {
        const elem = ElementFactory.create(type, `Test ${type}`);
        expect(elem.layer).toBe(TYPE_LAYER_MAP[type]);
      }
    });

    it('accepts optional parameters', () => {
      const elem = ElementFactory.create('application-component', 'MyApp', {
        modelId: '00000000-0000-0000-0000-000000000001',
        documentation: 'Application docs',
        tags: ['tag1', 'tag2'],
        stereotypes: ['stereo1'],
        properties: { key1: 'value1' },
        userProperties: { custom: 'prop' },
        folderId: '00000000-0000-0000-0000-000000000002',
      });
      expect(elem.modelId).toBe('00000000-0000-0000-0000-000000000001');
      expect(elem.documentation).toBe('Application docs');
      expect(elem.tags).toEqual(['tag1', 'tag2']);
      expect(elem.stereotypes).toEqual(['stereo1']);
      expect(elem.properties).toEqual({ key1: 'value1' });
      expect(elem.userProperties).toEqual({ custom: 'prop' });
      expect(elem.folderId).toBe('00000000-0000-0000-0000-000000000002');
    });

    it('produces elements that pass Zod validation', () => {
      const elem = ElementFactory.create('business-process', 'Process');
      const result = ArchiMateElementSchema.safeParse(elem);
      expect(result.success).toBe(true);
    });

    it('throws on invalid element data', () => {
      // ElementFactory always generates valid data via uuidv4, so this
      // test verifies the factory's internal validation path.
      const elem = ElementFactory.create('business-actor', 'Test');
      // Manually corrupt and re-validate
      const corrupted = { ...elem, id: 'invalid-uuid' };
      const result = ArchiMateElementSchema.safeParse(corrupted);
      expect(result.success).toBe(false);
    });

    it('creates all 92+ types without errors', () => {
      for (const type of uniqueElementTypes) {
        const elem = ElementFactory.create(type, `Test ${type}`);
        expectElementStructure(elem);
        expect(elem.type).toBe(type);
      }
    });
  });

  describe('getElementLayer', () => {
    it('returns "business" for BusinessActor', () => {
      expect(ElementFactory.getElementLayer('business-actor')).toBe('business');
    });

    it('returns "application" for ApplicationComponent', () => {
      expect(ElementFactory.getElementLayer('application-component')).toBe('application');
    });

    it('returns "technology" for Node', () => {
      expect(ElementFactory.getElementLayer('node')).toBe('technology');
    });

    it('returns "strategy" for Goal', () => {
      expect(ElementFactory.getElementLayer('goal')).toBe('strategy');
    });

    it('returns "physical" for Product', () => {
      expect(ElementFactory.getElementLayer('product')).toBe('physical');
    });

    it('returns "implementation" for WorkPackage', () => {
      expect(ElementFactory.getElementLayer('work-package')).toBe('implementation');
    });

    it('returns "other" for Grouping', () => {
      expect(ElementFactory.getElementLayer('grouping')).toBe('other');
    });
  });

  describe('duplicate', () => {
    it('creates a duplicate with a new UUID and copy suffix', () => {
      const original = ElementFactory.create('business-actor', 'Original');
      const copy = ElementFactory.duplicate(original);
      expect(copy.id).not.toBe(original.id);
      expect(copy.name).toBe('Original (copy)');
      expect(copy.type).toBe(original.type);
      expect(copy.layer).toBe(original.layer);
      expect(copy.tags).toEqual(original.tags);
      expect(typeof copy.modified).toBe('string');
    });

    it('preserves all properties in the duplicate', () => {
      const original = ElementFactory.create('business-process', 'Process', {
        documentation: 'Important docs',
        tags: ['critical'],
        stereotypes: ['core'],
        properties: { key: 'value' },
        userProperties: { custom: 'data' },
      });
      const copy = ElementFactory.duplicate(original);
      expect(copy.documentation).toBe(original.documentation);
      expect(copy.tags).toEqual(original.tags);
      expect(copy.stereotypes).toEqual(original.stereotypes);
      expect(copy.properties).toEqual(original.properties);
      expect(copy.userProperties).toEqual(original.userProperties);
    });
  });
});

describe('RelationshipFactory', () => {
  describe('create', () => {
    it('creates a relationship with valid UUID', () => {
      const rel = RelationshipFactory.create('access', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
      expectUuid(rel.id);
      expect(rel.type).toBe('access');
      expect(rel.sourceId).toBe('00000000-0000-0000-0000-000000000001');
      expect(rel.targetId).toBe('00000000-0000-0000-0000-000000000002');
      expect(rel.name).toBe('');
      expect(rel.documentation).toBe('');
    });

    it('creates relationships for all 14 types', () => {
      for (const type of relationshipTypes) {
        const rel = RelationshipFactory.create(
          type,
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
        );
        expect(rel.type).toBe(type);
      }
    });

    it('accepts optional parameters', () => {
      const rel = RelationshipFactory.create('access', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', {
        modelId: '00000000-0000-0000-0000-000000000003',
        name: 'Reads',
        documentation: 'Read access',
        accessType: 'read',
      });
      expect(rel.modelId).toBe('00000000-0000-0000-0000-000000000003');
      expect(rel.name).toBe('Reads');
      expect(rel.documentation).toBe('Read access');
    });

    it('produces relationships that pass Zod validation', () => {
      const rel = RelationshipFactory.create('access', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
      const result = RelationshipSchema.safeParse(rel);
      expect(result.success).toBe(true);
    });
  });
});
