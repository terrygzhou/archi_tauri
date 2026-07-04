/**
 * ArchiMateExchange — Open ArchiMate XML Exchange format.
 * Implements the OASIS Open ArchiMate standard for interoperability
 * with other ArchiMate modeling tools.
 */

import {
  Model,
  ArchiMateElement,
  Relationship,
  Diagram,
  OpenArchimateModel,
  OpenArchimateModelSchema,
} from '../../types/domain';
import { ArchiMateElementType, ArchiMateLayer } from '../../types/archimate';

// XML namespace
const NS = 'http://www.opengroup.org/archimate/';

/**
 * Convert Model to Open ArchiMate XML.
 */
export class ArchiMateExchange {
  /**
   * Convert an internal Model to Open ArchiMate exchange format.
   */
  static toOpenArchimate(model: Model): OpenArchimateModel {
    return {
      model: {
        id: model.id,
        name: model.name,
        archimateVersion: model.archimateVersion,
        description: model.description || '',
        author: '',
        created: model.created,
        modified: model.modified,
      },
      elements: model.elements.map(el => ({
        name: el.name,
        id: el.id,
        type: el.type,
        documentation: el.documentation ?? '',
        tags: el.tags.join(','),
        properties: Object.entries(el.properties || {}).map(([key, value]) => ({
          value: String(value ?? ''),
          key,
        })),
      })),
      relationships: model.relationships.map(rel => ({
        id: rel.id,
        type: rel.type,
        source: rel.sourceId,
        target: rel.targetId,
        name: rel.name || '',
        documentation: rel.documentation || '',
      })),
      diagrams: model.diagrams.map(d => ({
        id: d.id,
        name: d.name,
        cells: {},
      })),
    };
  }

  /**
   * Convert Open ArchiMate exchange format to internal Model.
   */
  static fromOpenArchimate(data: OpenArchimateModel): Model {
    const now = new Date().toISOString();

    // Validate the Open ArchiMate data
    const result = OpenArchimateModelSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid Open ArchiMate data: ${result.error.message}`);
    }

    const oam = result.data;

    return {
      id: oam.model.id || crypto.randomUUID(),
      name: oam.model.name,
      version: '1.0.0',
      archimateVersion: oam.model.archimateVersion,
      description: oam.model.description || '',
      folders: [],
      elements: oam.elements.map(el => {
        const layer = this.determineLayer(el.type) as ArchiMateLayer;
        return {
          name: el.name,
          id: el.id,
          type: el.type as ArchiMateElementType,
          documentation: el.documentation || '',
          tags: el.tags ? el.tags.split(',').filter(Boolean) : [],
          stereotypes: [] as string[],
          properties: (el.properties || []).reduce(
            (acc, p) => ({ ...acc, [p.key]: p.value }),
            {} as Record<string, any>,
          ),
          userProperties: {} as Record<string, string>,
          layer,
          folderId: null,
          created: now,
          modified: now,
          modelId: oam.model.id,
        } as unknown as ArchiMateElement;
      }),
      relationships: oam.relationships.map(rel => ({
        id: rel.id,
        type: rel.type as any,
        sourceId: rel.source,
        targetId: rel.target,
        modelId: oam.model.id || crypto.randomUUID(),
        name: rel.name,
        documentation: rel.documentation,
        created: now,
        modified: now,
      })),
      diagrams: oam.diagrams.map(d => ({
        name: d.name,
        id: d.id,
        modelId: oam.model.id || crypto.randomUUID(),
        gridSize: 10,
        gridVisible: true,
        gridSnap: true,
        backgroundColor: '#FFFFFF',
        elements: [],
        connections: [],
        created: now,
        modified: now,
      })),
      created: oam.model.created || now,
      modified: oam.model.modified || now,
    };
  }

  /**
   * Serialize to XML string.
   */
  static toXML(model: Model): string {
    const oam = this.toOpenArchimate(model);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<archimateModel xmlns="${NS}" `;
    xml += `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" `;
    xml += `xsi:schemaLocation="${NS} ${NS}schema.xsd">\n`;
    xml += `  <metadata>\n`;
    xml += `    <id>${this.escapeXML(oam.model.id || '')}</id>\n`;
    xml += `    <name>${this.escapeXML(oam.model.name)}</name>\n`;
    xml += `    <archimateVersion>${this.escapeXML(oam.model.archimateVersion)}</archimateVersion>\n`;
    if (oam.model.description) {
      xml += `    <description>${this.escapeXML(oam.model.description)}</description>\n`;
    }
    if (oam.model.author) {
      xml += `    <author>${this.escapeXML(oam.model.author)}</author>\n`;
    }
    xml += `  </metadata>\n`;

    xml += `  <elements>\n`;
    for (const el of oam.elements) {
      xml += `    <element id="${this.escapeXML(el.id)}" type="${this.escapeXML(el.type)}">\n`;
      xml += `      <name>${this.escapeXML(el.name)}</name>\n`;
      if (el.documentation) {
        xml += `      <documentation>${this.escapeXML(el.documentation)}</documentation>\n`;
      }
      if (el.tags) {
        xml += `      <tags>${this.escapeXML(el.tags)}</tags>\n`;
      }
      if (el.properties && el.properties.length > 0) {
        xml += `      <properties>\n`;
        for (const p of el.properties) {
          xml += `        <property key="${this.escapeXML(p.key)}">${this.escapeXML(p.value)}</property>\n`;
        }
        xml += `      </properties>\n`;
      }
      xml += `    </element>\n`;
    }
    xml += `  </elements>\n`;

    xml += `  <relationships>\n`;
    for (const rel of oam.relationships) {
      xml += `    <relationship id="${this.escapeXML(rel.id)}" type="${this.escapeXML(rel.type)}">\n`;
      xml += `      <source>${this.escapeXML(rel.source)}</source>\n`;
      xml += `      <target>${this.escapeXML(rel.target)}</target>\n`;
      if (rel.name) {
        xml += `      <name>${this.escapeXML(rel.name)}</name>\n`;
      }
      if (rel.documentation) {
        xml += `      <documentation>${this.escapeXML(rel.documentation)}</documentation>\n`;
      }
      xml += `    </relationship>\n`;
    }
    xml += `  </relationships>\n`;
    xml += `</archimateModel>\n`;

    return xml;
  }

  /**
   * Round-trip: Model → OpenArchimate → Model, compare key fields.
   */
  static roundTrip(model: Model): Model {
    const oam = this.toOpenArchimate(model);
    return this.fromOpenArchimate(oam);
  }

  /**
   * Determine the ArchiMate layer for an element type.
   */
  private static determineLayer(type: string): string {
    const layerMap: Record<string, string> = {
      Capability: 'strategy', Resource: 'strategy', ValueStream: 'strategy',
      CourseOfAction: 'strategy',
      BusinessActor: 'business', BusinessCollaboration: 'business',
      BusinessEvent: 'business', BusinessFunction: 'business',
      BusinessInteraction: 'business', BusinessInterface: 'business',
      BusinessObject: 'business', BusinessProcess: 'business',
      BusinessRole: 'business', BusinessService: 'business',
      Location: 'business',
      ApplicationCollaboration: 'application',
      ApplicationComponent: 'application', ApplicationEvent: 'application',
      ApplicationFunction: 'application', ApplicationInteraction: 'application',
      ApplicationInterface: 'application', ApplicationProcess: 'application',
      ApplicationService: 'application',
      TechnologyCollaboration: 'technology',
      TechnologyComponent: 'technology', TechnologyEvent: 'technology',
      TechnologyFunction: 'technology', TechnologyInteraction: 'technology',
      TechnologyInterface: 'technology', TechnologyProcess: 'technology',
      TechnologyService: 'technology', Node: 'technology',
      CommunicationNetwork: 'technology',
      Facility: 'physical', Equipment: 'physical',
      SystemSoftware: 'physical', CommunicationPath: 'physical',
      DistributionNetwork: 'physical', Product: 'physical',
      WorkPackage: 'implementation', Plateau: 'implementation',
      Gap: 'implementation', Contract: 'implementation',
      Deliverable: 'implementation', ImplementationEvent: 'implementation',
      Representation: 'implementation', Meaning: 'implementation',
      Stakeholder: 'motivation', Driver: 'motivation', Goal: 'motivation',
      Requirement: 'motivation', Constraint: 'motivation',
      Principle: 'motivation', Assessment: 'motivation',
      Value: 'motivation',
      Grouping: 'other', Junction: 'other', DataObject: 'other',
      Material: 'other', Artifact: 'other',
      LineConnection: 'other', Note: 'other',
    };
    return layerMap[type] || 'other';
  }

  /**
   * Escape special XML characters.
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
