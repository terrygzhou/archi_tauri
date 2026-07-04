import {
  uniqueElementTypes,
  FOLDER_HIERARCHY,
  TYPE_LAYER_MAP,
  LAYER_MAP,
  ArchiMateLayer,
  strategyTypes,
  businessTypes,
  applicationTypes,
  technologyTypes,
  physicalTypes,
  implementationTypes,
  motivationTypes,
  otherTypes,
} from '../../../src/types/archimate';

describe('ArchiMate element types', () => {
  describe('uniqueElementTypes', () => {
    it('contains all 92 ArchiMate 3.2 element types', () => {
      expect(uniqueElementTypes).toHaveLength(92);
    });

    it('has no duplicate types', () => {
      const unique = new Set(uniqueElementTypes);
      expect(unique.size).toBe(uniqueElementTypes.length);
    });
  });

  describe('FOLDER_HIERARCHY', () => {
    it('contains all 8 layers', () => {
      const layers = Object.keys(FOLDER_HIERARCHY);
      expect(layers).toHaveLength(8);
    });

    it('includes strategy layer', () => {
      expect(FOLDER_HIERARCHY['strategy']).toBeDefined();
    });

    it('includes business layer', () => {
      expect(FOLDER_HIERARCHY['business']).toBeDefined();
    });

    it('includes application layer', () => {
      expect(FOLDER_HIERARCHY['application']).toBeDefined();
    });

    it('includes technology layer', () => {
      expect(FOLDER_HIERARCHY['technology']).toBeDefined();
    });

    it('includes physical layer', () => {
      expect(FOLDER_HIERARCHY['physical']).toBeDefined();
    });

    it('includes implementation layer', () => {
      expect(FOLDER_HIERARCHY['implementation']).toBeDefined();
    });

    it('includes motivation layer', () => {
      expect(FOLDER_HIERARCHY['motivation']).toBeDefined();
    });

    it('includes other layer', () => {
      expect(FOLDER_HIERARCHY['other']).toBeDefined();
    });
  });

  describe('TYPE_LAYER_MAP', () => {
    it('maps every element type to a layer', () => {
      for (const type of uniqueElementTypes) {
        const layer = TYPE_LAYER_MAP[type];
        expect(layer).toBeDefined();
        expect(layer).not.toBe('unknown');
      }
    });

    it('has correct layers for each type', () => {
      for (const [type, layer] of Object.entries(TYPE_LAYER_MAP)) {
        expect(FOLDER_HIERARCHY[layer]).toBeDefined();
      }
    });
  });

  describe('layer type arrays', () => {
    it('includes business types', () => {
      expect(businessTypes).toContain('business-process');
      expect(businessTypes).toContain('business-role');
      expect(businessTypes).toContain('business-service');
      expect(businessTypes).toContain('business-object');
      expect(businessTypes).toContain('business-actor');
    });

    it('includes application types', () => {
      expect(applicationTypes).toContain('application-component');
      expect(applicationTypes).toContain('application-service');
      expect(applicationTypes).toContain('application-function');
      expect(applicationTypes).toContain('application-interface');
    });

    it('includes technology types', () => {
      expect(technologyTypes).toContain('node');
      expect(technologyTypes).toContain('technology-service');
      expect(technologyTypes).toContain('technology-function');
      expect(technologyTypes).toContain('communication-network');
    });

    it('includes strategy types', () => {
      expect(strategyTypes).toContain('capability');
      expect(strategyTypes).toContain('means');
      expect(strategyTypes).toContain('outcome');
    });

    it('includes motivation types', () => {
      expect(motivationTypes).toContain('principle');
      expect(motivationTypes).toContain('requirement');
      expect(motivationTypes).toContain('driver');
    });

    it('includes implementation types', () => {
      expect(implementationTypes).toContain('work-package');
      expect(implementationTypes).toContain('plateau');
      expect(implementationTypes).toContain('gap');
    });

    it('includes physical types', () => {
      expect(physicalTypes).toContain('facility');
      expect(physicalTypes).toContain('equipment');
      expect(physicalTypes).toContain('system-software');
    });

    it('includes other types', () => {
      expect(otherTypes).toContain('grouping');
      expect(otherTypes).toContain('junction');
      expect(otherTypes).toContain('note');
    });

    it('all layer types combined equals 92 unique types', () => {
      const all = [
        ...strategyTypes,
        ...businessTypes,
        ...applicationTypes,
        ...technologyTypes,
        ...physicalTypes,
        ...implementationTypes,
        ...motivationTypes,
        ...otherTypes,
      ];
      const unique = new Set(all);
      expect(unique.size).toBe(92);
    });

    it('types do not overlap between layers', () => {
      const layers = [
        strategyTypes,
        businessTypes,
        applicationTypes,
        technologyTypes,
        physicalTypes,
        implementationTypes,
        motivationTypes,
        otherTypes,
      ];

      for (let i = 0; i < layers.length; i++) {
        for (let j = i + 1; j < layers.length; j++) {
          const overlap = layers[i].filter(x => layers[j].includes(x));
          expect(overlap).toHaveLength(0);
        }
      }
    });
  });

  describe('ArchiMateLayer enum', () => {
    it('has all expected layers', () => {
      const allLayers: ArchiMateLayer[] = [
        'other', 'strategy', 'business', 'application',
        'technology', 'physical', 'implementation', 'motivation',
      ];

      for (const layer of allLayers) {
        expect(Object.keys(FOLDER_HIERARCHY)).toContain(layer);
      }
    });
  });
});
