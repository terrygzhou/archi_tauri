import { ModelFactory } from '../../../src/model/factory';
import { ArchiMateElement, Relationship, Diagram, Model } from '../../../src/types/domain';

describe('ModelFactory', () => {
  describe('createModel', () => {
    it('creates a model with default properties', () => {
      const model = ModelFactory.create('Test Model');

      expect(model.name).toBe('Test Model');
      expect(model.elements).toEqual([]);
      expect(model.relationships).toEqual([]);
      expect(model.diagrams).toEqual([]);
      expect(model.version).toBe('1.0.0');
      expect(model.created).toBeDefined();
      expect(model.modified).toBeDefined();
    });

    it('creates a model with custom options', () => {
      const model = ModelFactory.create('Custom Model', {
        version: '2.0',
        description: 'A test model',
      });

      expect(model.name).toBe('Custom Model');
      expect(model.version).toBe('2.0');
      expect(model.description).toBe('A test model');
    });
  });

  describe('addElement', () => {
    it('adds an element to a model', () => {
      let model = ModelFactory.create('Test Model');
      const element: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, element);
      expect(model.elements).toHaveLength(1);
      expect(model.elements[0].id).toBe('el-1');
      expect(model.elements[0].name).toBe('Process');
      expect(model.elements[0].type).toBe('business-process');
    });

    it('adds multiple elements', () => {
      let model = ModelFactory.create('Multi Element Model');

      const el1: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process 1',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      const el2: ArchiMateElement = {
        id: 'el-2',
        type: 'application-component',
        name: 'Component',
        modelId: model.id,
        layer: 'application',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, el1);
      expect(model.elements).toHaveLength(1);

      model = ModelFactory.addElement(model, el2);
      expect(model.elements).toHaveLength(2);
      expect(model.elements[1].name).toBe('Component');
    });
  });

  describe('removeElement', () => {
    it('removes an element by id', () => {
      let model = ModelFactory.create('Test Model');
      const el: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, el);
      expect(model.elements).toHaveLength(1);

      model = ModelFactory.removeElement(model, 'el-1');
      expect(model.elements).toHaveLength(0);
    });

    it('does nothing if element not found', () => {
      let model = ModelFactory.create('Test Model');
      model = ModelFactory.removeElement(model, 'nonexistent');
      expect(model.elements).toHaveLength(0);
    });

    it('removes related relationships', () => {
      let model = ModelFactory.create('Test Model');

      const el1: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      const el2: ArchiMateElement = {
        id: 'el-2',
        type: 'business-service',
        name: 'Service',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, el1);
      model = ModelFactory.addElement(model, el2);

      const rel: Relationship = {
        id: 'rel-1',
        type: 'association',
        sourceId: 'el-1',
        targetId: 'el-2',
        modelId: model.id,
        name: '',
        documentation: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      model = ModelFactory.addRelationship(model, rel);
      expect(model.relationships).toHaveLength(1);

      model = ModelFactory.removeElement(model, 'el-1');
      expect(model.elements).toHaveLength(1);
      expect(model.relationships).toHaveLength(0);
    });
  });

  describe('addRelationship', () => {
    it('adds a relationship to a model', () => {
      let model = ModelFactory.create('Test Model');

      const rel: Relationship = {
        id: 'rel-1',
        type: 'association',
        sourceId: 'el-1',
        targetId: 'el-2',
        modelId: model.id,
        name: '',
        documentation: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addRelationship(model, rel);
      expect(model.relationships).toHaveLength(1);
      expect(model.relationships[0].type).toBe('association');
    });
  });

  describe('removeRelationship', () => {
    it('removes a relationship by id', () => {
      let model = ModelFactory.create('Test Model');

      const rel: Relationship = {
        id: 'rel-1',
        type: 'association',
        sourceId: 'el-1',
        targetId: 'el-2',
        modelId: model.id,
        name: '',
        documentation: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addRelationship(model, rel);
      expect(model.relationships).toHaveLength(1);

      model = ModelFactory.removeRelationship(model, 'rel-1');
      expect(model.relationships).toHaveLength(0);
    });
  });

  describe('addDiagram', () => {
    it('adds a diagram to a model', () => {
      let model = ModelFactory.create('Test Model');

      const diagram: Diagram = {
        id: 'd-1',
        name: 'Main Diagram',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        height: 600,
        width: 800,
        gridSize: 20,
        layout: 'free',
        modelId: model.id,
      };

      model = ModelFactory.addDiagram(model, diagram);
      expect(model.diagrams).toHaveLength(1);
      expect(model.diagrams[0].name).toBe('Main Diagram');
    });
  });

  describe('removeDiagram', () => {
    it('removes a diagram by id', () => {
      let model = ModelFactory.create('Test Model');

      const diagram: Diagram = {
        id: 'd-1',
        name: 'Main Diagram',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        height: 600,
        width: 800,
        modelId: model.id,
      };

      model = ModelFactory.addDiagram(model, diagram);
      model = ModelFactory.removeDiagram(model, 'd-1');
      expect(model.diagrams).toHaveLength(0);
    });
  });

  describe('updateElement', () => {
    it('updates an element by id', () => {
      let model = ModelFactory.create('Test Model');

      const el: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, el);
      model = ModelFactory.updateElement(model, 'el-1', {
        name: 'Updated Process',
        documentation: 'Updated description',
      });

      expect(model.elements[0].name).toBe('Updated Process');
      expect(model.elements[0].documentation).toBe('Updated description');
    });

    it('does nothing if element not found', () => {
      const model = ModelFactory.create('Test Model');
      const result = ModelFactory.updateElement(model, 'nonexistent', {
        name: 'Nope',
      });
      expect(result.elements).toHaveLength(0);
    });
  });

  describe('getElement', () => {
    it('returns an element by id', () => {
      let model = ModelFactory.create('Test Model');

      const el: ArchiMateElement = {
        id: 'el-1',
        type: 'business-process',
        name: 'Process',
        modelId: model.id,
        layer: 'business',
        documentation: '',
        tags: [],
        stereotypes: [],
        properties: {},
        userProperties: {},
        folderId: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      model = ModelFactory.addElement(model, el);
      const found = ModelFactory.getElement(model, 'el-1');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Process');
    });

    it('returns undefined for non-existent element', () => {
      const model = ModelFactory.create('Test Model');
      const found = ModelFactory.getElement(model, 'nonexistent');
      expect(found).toBeUndefined();
    });
  });
});
