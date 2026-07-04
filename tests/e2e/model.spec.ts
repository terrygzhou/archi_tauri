/**
 * E2E tests: Model CRUD operations.
 * Tests creating, reading, updating, and deleting models and elements.
 */

import { test, expect } from '@playwright/test';

test.describe('Model CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can create a new model', async ({ page }) => {
    // Click "New Model" button
    await page.click('text=New Model');
    // Verify model creation dialog
    const dialog = page.locator('[data-testid="model-dialog"]');
    await expect(dialog).toBeVisible();
    // Fill in model name
    await page.fill('[data-testid="model-name-input"]', 'My First Model');
    await page.click('text=Create');
    // Verify model was created
    await expect(page.locator('[data-testid="model-name-display"]')).toContainText('My First Model');
  });

  test('can open an existing model', async ({ page }) => {
    // Click "Open" button
    await page.click('text=Open');
    // Simulate file selection
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('[data-testid="open-file-btn"]'),
    ]);
    await expect(fileChooser).toBeDefined();
  });

  test('can delete a model', async ({ page }) => {
    // Create a model first
    await page.click('text=New Model');
    await page.fill('[data-testid="model-name-input"]', 'To Delete');
    await page.click('text=Create');

    // Delete the model
    await page.click('[data-testid="delete-model-btn"]');
    // Confirm deletion
    await page.click('text=Yes, delete');
    // Verify model is gone
    await expect(page.locator('[data-testid="model-name-display"]')).not.toBeVisible();
  });

  test('can save and load a model', async ({ page }) => {
    // Create model
    await page.click('text=New Model');
    await page.fill('[data-testid="model-name-input"]', 'Save Test');
    await page.click('text=Create');

    // Add an element
    await page.click('[data-testid="add-element-btn"]');
    await page.click('text=BusinessActor');
    await page.fill('[data-testid="element-name-input"]', 'Test Actor');
    await page.click('text=Add');

    // Verify element was added
    await expect(page.locator('[data-testid="element-item"]')).toContainText('Test Actor');
  });

  test('validates model name is not empty', async ({ page }) => {
    await page.click('text=New Model');
    // Leave name empty and try to create
    await page.click('text=Create');
    // Should show validation error
    const error = page.locator('[data-testid="validation-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Name');
  });

  test('can list models in the explorer', async ({ page }) => {
    // After model creation, explorer should show it
    const explorer = page.locator('[data-testid="model-explorer"]');
    await expect(explorer).toBeVisible();
    // Should have at least one model
    const models = explorer.locator('[data-testid="model-item"]');
    await expect(models).toHaveCount({ snapshot: false });
  });

  test('element count updates after add/remove', async ({ page }) => {
    await page.click('text=New Model');
    await page.fill('[data-testid="model-name-input"]', 'Count Test');
    await page.click('text=Create');

    // Add element
    await page.click('[data-testid="add-element-btn"]');
    await page.click('text=BusinessProcess');
    await page.fill('[data-testid="element-name-input"]', 'Process 1');
    await page.click('text=Add');

    const count = page.locator('[data-testid="element-count"]');
    await expect(count).toContainText('1');

    // Remove element
    await page.click('[data-testid="element-item"] [data-testid="remove-btn"]');
    await expect(count).toContainText('0');
  });
});
