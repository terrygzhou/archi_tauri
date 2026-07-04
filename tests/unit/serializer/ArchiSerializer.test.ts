/**
 * Unit tests: ArchiSerializer (.archi JSON format).
 * Tests serialization, deserialization, and round-trip fidelity.
 */

import { describe, it, expect } from 'vitest';
import { ArchiSerializer } from '../../../src/model/serializer/archi';
import { ModelFactory, ElementFactory } from '../../../src/model/factory';
import {
  createSampleModel,
} from '../../utils/fixtures';

describe('ArchiSerializer', () => {
  describe('serialize', () => {
    it('serializes an empty model', () => {
      const model = ModelFactory.create('Empty Model');
      const json = ArchiSerializer.serialize(model);
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.format).toBe('archi-model');
      expect(parsed.formatVersion).toBe('1.0.0');
      expect(parsed.name).toBe('Empty Model');
    });

    it('serializes a model with elements', () => {
      const model = createSampleModel();
      const json = ArchiSerializer.serialize(model);
      const parsed = JSON.parse(json);
      expect(parsed.elements.length).toBe(model.elements.length);
      expect(parsed.relationships.length).toBe(model.relationships.length);
      expect(parsed.diagrams.length).toBe(model.diagrams.length);
    });

    it('produces formatted JSON with indentation', () => {
      const model = ModelFactory.create('Test');
      const json = ArchiSerializer.serialize(model);
      // Check for 2-space indentation
      expect(json).toContain('\n  ');
    });

    it('includes format and formatVersion fields', () => {
      const model = ModelFactory.create('Test');
      const json = ArchiSerializer.serialize(model);
      const parsed = JSON.parse(json);
      expect(parsed.format).toBe('archi-model');
      expect(parsed.formatVersion).toBe('1.0.0');
    });
  });

  describe('deserialize', () => {
    it('deserializes valid JSON back to Model', () => {
      const model = ModelFactory.create('Test Model');
      const json = ArchiSerializer.serialize(model);
      const deserialized = ArchiSerializer.deserialize(json);
      expect(deserialized.name).toBe('Test Model');
      expect(deserialized.version).toBe('1.0.0');
    });

    it('deserializes a model with elements and relationships', () => {
      const model = createSampleModel();
      const json = ArchiSerializer.serialize(model);
      const deserialized = ArchiSerializer.deserialize(json);

      expect(deserialized.elements.length).toBe(model.elements.length);
      expect(deserialized.relationships.length).toBe(model.relationships.length);
      expect(deserialized.diagrams.length).toBe(model.diagrams.length);

      for (const [i, elem] of deserialized.elements.entries()) {
        expect(elem.id).toBe(model.elements[i].id);
        expect(elem.type).toBe(model.elements[i].type);
        expect(elem.name).toBe(model.elements[i].name);
      }
    });
  });

  describe('round-trip fidelity', () => {
    it('preserves model identity', () => {
      const model = ModelFactory.create('Round Trip Test', {
        version: '2.0.0',
        archimateVersion: '3.1',
        description: 'Testing round-trip',
      });
      const roundTripped = ArchiSerializer.roundTrip(model);
      expect(roundTripped.id).toBe(model.id);
      expect(roundTripped.name).toBe(model.name);
      expect(roundTripped.version).toBe(model.version);
      expect(roundTripped.archimateVersion).toBe(model.archimateVersion);
      expect(roundTripped.description).toBe(model.description);
    });

    it('preserves element data through round-trip', () => {
      const model = createSampleModel();
      const roundTripped = ArchiSerializer.roundTrip(model);

      expect(roundTripped.elements.length).toBe(model.elements.length);
      for (const [i, orig] of model.elements.entries()) {
        const round = roundTripped.elements[i];
        expect(round.id).toBe(orig.id);
        expect(round.type).toBe(orig.type);
        expect(round.name).toBe(orig.name);
        expect(round.layer).toBe(orig.layer);
      }
    });

    it('preserves relationship data through round-trip', () => {
      const model = createSampleModel();
      const roundTripped = ArchiSerializer.roundTrip(model);

      expect(roundTripped.relationships.length).toBe(model.relationships.length);
      for (const [i, orig] of model.relationships.entries()) {
        const round = roundTripped.relationships[i];
        expect(round.id).toBe(orig.id);
        expect(round.type).toBe(orig.type);
        expect(round.sourceId).toBe(orig.sourceId);
        expect(round.targetId).toBe(orig.targetId);
      }
    });

    it('preserves diagram data through round-trip', () => {
      const model = createSampleModel();
      const roundTripped = ArchiSerializer.roundTrip(model);

      expect(roundTripped.diagrams.length).toBe(model.diagrams.length);
      for (const [i, orig] of model.diagrams.entries()) {
        const round = roundTripped.diagrams[i];
        expect(round.id).toBe(orig.id);
        expect(round.name).toBe(orig.name);
      }
    });

    it('handles a complex model with many element types', () => {
      let model = ModelFactory.create('Complex Test');
      const types = [
        'business-actor', 'business-process', 'business-service',
        'application-component', 'application-service',
        'technology-component', 'node', 'communication-network',
        'product', 'capability', 'goal', 'requirement',
        'stakeholder', 'driver', 'value-stream',
        'work-package', 'plateau', 'gap',
        'contract', 'deliverable', 'implementation-event',
        'grouping', 'junction', 'data-object',
      ];

      const elements = types.map(t =>
        ElementFactory.create(t as any, `Test ${t}`, { modelId: model.id }),
      );

      for (const elem of elements) {
        model = ModelFactory.addElement(model, elem);
      }

      const roundTripped = ArchiSerializer.roundTrip(model);
      expect(roundTripped.elements.length).toBe(elements.length);
      for (const [i, orig] of elements.entries()) {
        const round = roundTripped.elements[i];
        expect(round.type).toBe(orig.type);
        expect(round.name).toBe(orig.name);
        expect(round.layer).toBe(orig.layer);
      }
    });
  });

  describe('isValid', () => {
    it('returns true for valid .archi format', () => {
      const model = ModelFactory.create('Test');
      const json = ArchiSerializer.serialize(model);
      expect(ArchiSerializer.isValid(json)).toBe(true);
    });

    it('returns false for non-.archi JSON', () => {
      expect(ArchiSerializer.isValid('{"not": "archi"}')).toBe(false);
    });

    it('returns false for non-JSON', () => {
      expect(ArchiSerializer.isValid('not json at all')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(ArchiSerializer.isValid('')).toBe(false);
    });
  });
});
