import { ArchiMateExchange } from '../../../src/model/serializer/archimate-exchange';
import { ModelFactory } from '../../../src/model/factory';
import { Model, Relationship, Diagram } from '../../../src/types/domain';
import { createSampleModel } from '../../utils/fixtures';

describe('ArchiMateExchange (Open ArchiMate XML)', () => {
  describe('toXML', () => {
    it('serializes an empty model', () => {
      const model = ModelFactory.create('Empty Model');

      const xml = ArchiMateExchange.toXML(model);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('xmlns="http://www.opengroup.org/archimate/"');
      expect(xml).toContain('<archimateModel');
      expect(xml).toContain('Empty Model');
    });

    it('serializes a model with elements', () => {
      const model = createSampleModel();
      const xml = ArchiMateExchange.toXML(model);

      for (const el of model.elements) {
        expect(xml).toContain(el.name);
      }
    });

    it('serializes relationships', () => {
      let model = createSampleModel();

      const rel: Relationship = {
        id: crypto.randomUUID(),
        type: 'association',
        sourceId: model.elements[0].id,
        targetId: model.elements[1].id,
        modelId: model.id,
        name: 'Process to Service',
        documentation: '',
      };

      model = ModelFactory.addRelationship(model, rel);
      const xml = ArchiMateExchange.toXML(model);

      expect(xml).toContain('Process to Service');
    });

    it('serializes diagrams without error', () => {
      let model = createSampleModel();

      const diagram: Diagram = {
        id: crypto.randomUUID(),
        name: 'Main Diagram',
        modelId: model.id,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        height: 600,
        width: 800,
        gridSize: 10,
        layout: {},
      };

      model = ModelFactory.addDiagram(model, diagram);
      const xml = ArchiMateExchange.toXML(model);

      // toXML serializes metadata, elements, and relationships (not diagrams in XML output)
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('Sample Model');
    });

    it('produces valid XML structure', () => {
      const model = createSampleModel();
      const xml = ArchiMateExchange.toXML(model);

      expect(xml).toMatch(/<archimateModel[^>]*>/);
      expect(xml).toContain('</archimateModel>');
    });
  });

  describe('toOpenArchimate / fromOpenArchimate', () => {
    it('converts a model to Open ArchiMate format', () => {
      const model = createSampleModel();
      const oam = ArchiMateExchange.toOpenArchimate(model);

      expect(oam.model.name).toBe(model.name);
      expect(oam.elements.length).toBe(model.elements.length);
      expect(oam.relationships.length).toBe(model.relationships.length);
      expect(oam.diagrams.length).toBe(model.diagrams.length);
    });

    it('round-trips a model with elements', () => {
      const model = createSampleModel();
      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      expect(deserialized.name).toBe(model.name);

      for (const el of model.elements) {
        expect(deserialized.elements).toContainEqual(
          expect.objectContaining({ id: el.id, name: el.name, type: el.type }),
        );
      }
    });

    it('round-trips a model with relationships', () => {
      let model = createSampleModel();

      const rel: Relationship = {
        id: crypto.randomUUID(),
        type: 'association',
        sourceId: model.elements[0].id,
        targetId: model.elements[1].id,
        modelId: model.id,
        name: 'Test Relation',
        documentation: '',
      };

      model = ModelFactory.addRelationship(model, rel);
      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      const restored = deserialized.relationships.find(r => r.id === rel.id);
      expect(restored).toBeDefined();
      expect(restored!.sourceId).toBe(rel.sourceId);
      expect(restored!.targetId).toBe(rel.targetId);
    });

    it('round-trips a model with diagrams', () => {
      let model = createSampleModel();

      const diagram: Diagram = {
        id: crypto.randomUUID(),
        name: 'Main Diagram',
        modelId: model.id,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        height: 600,
        width: 800,
        gridSize: 10,
        layout: {},
      };

      model = ModelFactory.addDiagram(model, diagram);
      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      const restored = deserialized.diagrams.find(d => d.id === diagram.id);
      expect(restored).toBeDefined();
      expect(restored!.name).toBe('Main Diagram');
    });

    it('handles malformed input gracefully', () => {
      expect(() =>
        ArchiMateExchange.fromOpenArchimate({} as any),
      ).toThrow('Invalid Open ArchiMate data');
    });
  });

  describe('round-trip fidelity', () => {
    it('preserves element properties through serialization cycle', () => {
      const model = createSampleModel();
      const originalElement = model.elements[0];

      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      const restored = deserialized.elements.find(e => e.id === originalElement.id);
      expect(restored).toBeDefined();
      expect(restored!.name).toBe(originalElement.name);
      expect(restored!.type).toBe(originalElement.type);
    });

    it('preserves relationship properties', () => {
      let model = createSampleModel();

      const rel: Relationship = {
        id: crypto.randomUUID(),
        type: 'association',
        sourceId: model.elements[0].id,
        targetId: model.elements[1].id,
        modelId: model.id,
        name: 'Test Relation',
        documentation: 'Test documentation',
      };

      model = ModelFactory.addRelationship(model, rel);
      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      const restored = deserialized.relationships.find(r => r.id === rel.id);
      expect(restored).toBeDefined();
      expect(restored!.sourceId).toBe(model.elements[0].id);
      expect(restored!.targetId).toBe(model.elements[1].id);
    });

    it('preserves diagram properties', () => {
      let model = createSampleModel();

      const diagram: Diagram = {
        id: crypto.randomUUID(),
        name: 'Main Diagram',
        modelId: model.id,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        height: 600,
        width: 800,
        gridSize: 10,
        layout: {},
      };

      model = ModelFactory.addDiagram(model, diagram);
      const deserialized = ArchiMateExchange.roundTrip(model);

      expect(deserialized).toBeDefined();
      const restored = deserialized.diagrams.find(d => d.id === diagram.id);
      expect(restored).toBeDefined();
      expect(restored!.name).toBe('Main Diagram');
    });

    it('multiple round-trips preserve data integrity', () => {
      const model = createSampleModel();

      // First round-trip
      const deserialized1 = ArchiMateExchange.roundTrip(model);
      expect(deserialized1).toBeDefined();

      // Second round-trip
      const deserialized2 = ArchiMateExchange.roundTrip(deserialized1);
      expect(deserialized2).toBeDefined();

      // Third round-trip
      const deserialized3 = ArchiMateExchange.roundTrip(deserialized2);
      expect(deserialized3).toBeDefined();

      // Verify data integrity through multiple cycles
      expect(deserialized3.name).toBe(model.name);
      expect(deserialized3.elements.length).toBe(deserialized2.elements.length);
    });
  });
});
