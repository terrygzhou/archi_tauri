/**
 * Test helpers — shared utilities for assertions and test setup.
 */

import { expect } from 'vitest';
import {
  Model,
  ArchiMateElement,
  Relationship,
  Diagram,
} from '../../src/types/domain';

// ── UUID assertion ─────────────────────────────────────────────────────────
export function expectUuid(value: string): void {
  expect(value).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
}

// ── ISO datetime assertion ─────────────────────────────────────────────────
export function expectIsoDate(value: string): void {
  expect(() => new Date(value)).not.toThrow();
  expect(new Date(value).toISOString()).toBe(new Date(value).toISOString());
}

// ── Model assertions ───────────────────────────────────────────────────────
export function expectModelStructure(model: Model): void {
  expect(model.id).toBeDefined();
  expect(model.name).toBeDefined();
  expect(model.name).not.toBe('');
  expect(model.version).toBeDefined();
  expect(model.archimateVersion).toBeDefined();
  expect(Array.isArray(model.elements)).toBe(true);
  expect(Array.isArray(model.relationships)).toBe(true);
  expect(Array.isArray(model.diagrams)).toBe(true);
  expect(model.created).toBeDefined();
  expect(model.modified).toBeDefined();
}

// ── Element assertions ─────────────────────────────────────────────────────
export function expectElementStructure(elem: ArchiMateElement): void {
  expect(elem.id).toBeDefined();
  expect(elem.type).toBeDefined();
  expect(elem.name).not.toBe('');
  expect(elem.layer).toBeDefined();
  expect(elem.created).toBeDefined();
  expect(elem.modified).toBeDefined();
  expect(Array.isArray(elem.tags)).toBe(true);
  expect(Array.isArray(elem.stereotypes)).toBe(true);
}

// ── Relationship assertions ────────────────────────────────────────────────
export function expectRelationshipStructure(rel: Relationship): void {
  expect(rel.id).toBeDefined();
  expect(rel.type).toBeDefined();
  expect(rel.sourceId).toBeDefined();
  expect(rel.targetId).toBeDefined();
}

// ── Diagram assertions ─────────────────────────────────────────────────────
export function expectDiagramStructure(diagram: Diagram): void {
  expect(diagram.id).toBeDefined();
  expect(diagram.name).not.toBe('');
  expect(diagram.modelId).toBeDefined();
  expect(diagram.width).toBeGreaterThan(0);
  expect(diagram.height).toBeGreaterThan(0);
  expect(diagram.gridSize).toBeGreaterThan(0);
  expect(diagram.created).toBeDefined();
  expect(diagram.modified).toBeDefined();
}

// ── Compare two objects (subset) ───────────────────────────────────────────
export function expectSubset(actual: object, expected: object): void {
  for (const [key, value] of Object.entries(expected)) {
    expect((actual as Record<string, unknown>)[key]).toBe(value);
  }
}

// ── Verify round-trip fidelity ────────────────────────────────────────────
export function expectRoundTripFidelity<T>(
  original: T,
  roundTripped: T,
  fieldsToCheck: (keyof T)[],
): void {
  for (const field of fieldsToCheck) {
    expect(roundTripped[field]).toBe(original[field]);
  }
}

// ── Count validation errors ────────────────────────────────────────────────
export function expectValidationErrors(result: { success: boolean; error?: { errors?: unknown[] } }): number {
  if (result.success) return 0;
  return Array.isArray(result.error?.errors) ? result.error.errors.length : 1;
}
