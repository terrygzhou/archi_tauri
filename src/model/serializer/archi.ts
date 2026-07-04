/**
 * ArchiSerializer — Serialization for .archi file format.
 * The .archi format is a JSON-based representation of ArchiMate models.
 * It is used internally by Archi Desktop for save/load operations.
 */

import {
  Model,
  ArchiMateElement,
  Relationship,
  Diagram,
  ModelExport,
  ModelExportSchema,
  ModelSchema,
} from '../../types/domain';

/**
 * Serialize a Model to the .archi JSON format.
 */
export class ArchiSerializer {
  /**
   * Serialize a Model object to a JSON string (the .archi format).
   */
  static serialize(model: Model): string {
    const exportData: ModelExport = {
      ...model,
      format: 'archi-model',
      formatVersion: '1.0.0',
    };

    const result = ModelExportSchema.safeParse(exportData);
    if (!result.success) {
      throw new Error(`Serialization error: ${result.error.message}`);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Deserialize a .archi JSON string into a Model.
   */
  static deserialize(json: string): Model {
    const parsed = JSON.parse(json);
    const result = ModelSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Deserialization error: ${result.error.message}`);
    }
    return result.data;
  }

  /**
   * Check if a string is a valid .archi format.
   */
  static isValid(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      return parsed.format === 'archi-model';
    } catch {
      return false;
    }
  }

  /**
   * Round-trip test: serialize then deserialize, compare key fields.
   */
  static roundTrip(model: Model): Model {
    const json = this.serialize(model);
    return this.deserialize(json);
  }
}
