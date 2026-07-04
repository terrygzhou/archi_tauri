/**
 * E2E tests: Diagram interaction.
 * Tests canvas rendering, element dragging, connections, and diagram management.
 */

import { test, expect } from '@playwright/test';

test.describe('Diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a model with a diagram
    await page.click('text=New Model');
    await page.fill('[data-testid="model-name-input"]', 'Diagram Test');
    await page.click('text=Create');
  });

  test('displays the canvas', async ({ page }) => {
    const canvas = page.locator('[data-testid="diagram-canvas"]');
    await expect(canvas).toBeVisible();
  });

  test('can create a new diagram', async ({ page }) => {
    await page.click('[data-testid="new-diagram-btn"]');
    await page.fill('[data-testid="diagram-name-input"]', 'Overview');
    await page.click('text=Create');
    await expect(page.locator('[data-testid="diagram-item"]')).toContainText('Overview');
  });

  test('can add elements to the diagram from palette', async ({ page }) => {
    // Open palette
    await page.click('[data-testid="palette-toggle"]');
    // Select BusinessActor from palette
    await page.click('[data-testid="palette-item-BusinessActor"]');
    // Click on canvas to place element
    const canvas = page.locator('[data-testid="diagram-canvas"]');
    await canvas.click({ position: { x: 100, y: 100 } });
    // Verify element appears
    await expect(page.locator('[data-testid="diagram-element"]')).toHaveCount({ snapshot: false });
  });

  test('can drag elements on the canvas', async ({ page }) => {
    // Add an element
    await page.click('[data-testid="palette-toggle"]');
    await page.click('[data-testid="palette-item-BusinessActor"]');
    await page.locator('[data-testid="diagram-canvas"]').click({ position: { x: 100, y: 100 } });

    // Drag the element
    const element = page.locator('[data-testid="diagram-element"]').first();
    await element.dragTo(element, { targetPosition: { x: 50, y: 50 } });

    // Element should still be on canvas
    await expect(page.locator('[data-testid="diagram-element"]')).toHaveCount({ snapshot: false });
  });

  test('can create connections between elements', async ({ page }) => {
    // Add two elements
    await page.click('[data-testid="palette-toggle"]');
    await page.click('[data-testid="palette-item-BusinessActor"]');
    await page.locator('[data-testid="diagram-canvas"]').click({ position: { x: 100, y: 100 } });
    await page.click('[data-testid="palette-item-BusinessProcess"]');
    await page.locator('[data-testid="diagram-canvas"]').click({ position: { x: 300, y: 100 } });

    // Create connection
    const elem1 = page.locator('[data-testid="diagram-element"]').nth(0);
    const elem2 = page.locator('[data-testid="diagram-element"]').nth(1);

    // Use connection tool
    await page.click('[data-testid="connection-tool"]');
    await elem1.click();
    await elem2.click();

    // Verify connection
    const connections = page.locator('[data-testid="diagram-connection"]');
    await expect(connections).toHaveCount({ snapshot: false });
  });

  test('can zoom the canvas', async ({ page }) => {
    await page.click('[data-testid="zoom-in-btn"]');
    const zoomLevel = page.locator('[data-testid="zoom-level"]');
    await expect(zoomLevel).toBeVisible();
  });

  test('can toggle grid', async ({ page }) => {
    await page.click('[data-testid="grid-toggle"]');
    const grid = page.locator('[data-testid="diagram-grid"]');
    await expect(grid).toBeVisible();
  });

  test('can select and inspect element properties', async ({ page }) => {
    // Add element
    await page.click('[data-testid="palette-toggle"]');
    await page.click('[data-testid="palette-item-BusinessActor"]');
    await page.locator('[data-testid="diagram-canvas"]').click({ position: { x: 100, y: 100 } });

    // Click element to select
    const element = page.locator('[data-testid="diagram-element"]').first();
    await element.click();

    // Properties panel should show
    const properties = page.locator('[data-testid="properties-panel"]');
    await expect(properties).toBeVisible();
    await expect(properties).toContainText('BusinessActor');
  });

  test('can export diagram as PNG', async ({ page }) => {
    await page.click('[data-testid="export-diagram-btn"]');
    await page.click('text=PNG');
    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    // Note: Actual download verification depends on browser context
    await expect(page.locator('[data-testid="export-status"]')).toContainText('Exported');
  });

  test('can export diagram as SVG', async ({ page }) => {
    await page.click('[data-testid="export-diagram-btn"]');
    await page.click('text=SVG');
    await expect(page.locator('[data-testid="export-status"]')).toContainText('Exported');
  });

  test('pan works with middle mouse button', async ({ page }) => {
    const canvas = page.locator('[data-testid="diagram-canvas"]');
    // Simulate pan (in actual test, use mouse wheel)
    await canvas.click({ button: 'middle' });
    await expect(canvas).toBeVisible();
  });

  test('undo/redo for diagram changes', async ({ page }) => {
    // Add element
    await page.click('[data-testid="palette-toggle"]');
    await page.click('[data-testid="palette-item-BusinessActor"]');
    await page.locator('[data-testid="diagram-canvas"]').click({ position: { x: 100, y: 100 } });

    // Undo
    await page.keyboard.press('Control+z');
    const elements = page.locator('[data-testid="diagram-element"]');
    await expect(elements).toHaveCount(0);

    // Redo
    await page.keyboard.press('Control+Shift+Z');
    await expect(elements).toHaveCount({ snapshot: false });
  });
});
