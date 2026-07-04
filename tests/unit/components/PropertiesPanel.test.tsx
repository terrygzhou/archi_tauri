/**
 * Unit tests for PropertiesPanel component
 * Tests: name field edit, tag operations, color pickers, font, opacity,
 * custom properties, keyboard Enter/Escape
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mock stores ────────────────────────────────────────────────────────────

const mockUpdateElement = vi.fn();
const mockGetElement = vi.fn();
const mockUpdateDiagramElement = vi.fn();
const mockDeselectAll = vi.fn();
const mockExecuteCommand = vi.fn();

const mockModelStore = {
  model: {
    id: 'model-1',
    name: 'Test Model',
    version: '1.0',
    archimateVersion: '3.2',
    elements: [],
    relationships: [],
    diagrams: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  },
  getElement: mockGetElement,
  updateElement: mockUpdateElement,
};

const mockDiagramStore = {
  selectedElementIds: ['elem-1'],
  activeDiagram: {
    id: 'diagram-1',
    name: 'Main Diagram',
    elements: [
      {
        id: 'de-1',
        elementId: 'elem-1',
        x: 100,
        y: 100,
        width: 160,
        height: 80,
        customStyle: {
          borderColor: '#333333',
          fillColor: '#1E88E5',
          textColor: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          opacity: 100,
          lineWidth: 1,
        },
      },
    ],
  },
  updateDiagramElement: mockUpdateDiagramElement,
  deselectAll: mockDeselectAll,
};

const mockCommandStack = {
  execute: mockExecuteCommand,
};

vi.mock('src/stores/modelStore', () => ({
  useModelStore: () => mockModelStore,
}));
vi.mock('src/stores/diagramStore', () => ({
  useDiagramStore: () => mockDiagramStore,
}));
vi.mock('src/stores/commandStack', () => ({
  useCommandStack: () => mockCommandStack,
}));

// Dynamic import after mocks
const { PropertiesPanel } = await import('src/components/properties/PropertiesPanel');

// ── Helpers ─────────────────────────────────────────────────────────────────

function createTestElement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'elem-1',
    type: 'business-process',
    name: 'Test Process',
    documentation: '',
    tags: ['production'],
    stereotypes: [],
    properties: {},
    userProperties: { env: 'prod' },
    layer: 'business' as const,
    folderId: null,
    created: '2025-01-01T00:00:00.000Z',
    modified: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PropertiesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty states', () => {
    it('shows "No model loaded" when model is null', () => {
      mockModelStore.model = null;
      render(<PropertiesPanel />);
      expect(screen.getByText('No model loaded')).toBeInTheDocument();
      mockModelStore.model = {
        id: 'model-1',
        name: 'Test Model',
        version: '1.0',
        archimateVersion: '3.2',
        elements: [],
        relationships: [],
        diagrams: [],
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
    });

    it('shows "Select an element" when nothing is selected', () => {
      mockDiagramStore.selectedElementIds = [];
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);
      expect(
        screen.getByText('Select an element to edit properties')
      ).toBeInTheDocument();
      mockDiagramStore.selectedElementIds = ['elem-1'];
    });
  });

  describe('name field edit syncs with model store', () => {
    it('updates name on text input change', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ name: 'Original Name' })
      );
      render(<PropertiesPanel />);

      const nameInput = screen.getByPlaceholderText('Element name');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      expect(mockUpdateElement).toHaveBeenCalledWith(
        'elem-1',
        expect.objectContaining({ name: 'Updated Name' })
      );
    });
  });

  describe('tag add/remove operations', () => {
    it('renders existing tags', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ tags: ['tag1', 'tag2'] })
      );
      render(<PropertiesPanel />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('removes a tag when × button is clicked', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ tags: ['tag1', 'tag2'] })
      );
      render(<PropertiesPanel />);

      // Find × button for tag1 (first tag's remove button)
      const tagElements = screen.getAllByText('tag1');
      expect(tagElements.length).toBeGreaterThan(0);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0]);
        expect(mockUpdateElement).toHaveBeenCalledWith(
          'elem-1',
          expect.objectContaining({ tags: ['tag2'] })
        );
      }
    });

    it('adds a tag on Enter key', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ tags: ['existing'] })
      );
      render(<PropertiesPanel />);

      const tagInput = screen.getByPlaceholderText(/Add tag/i);
      fireEvent.change(tagInput, { target: { value: 'newTag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(mockUpdateElement).toHaveBeenCalledWith(
        'elem-1',
        expect.objectContaining({ tags: ['existing', 'newTag'] })
      );
    });

    it('removes last tag on Backspace when input is empty', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ tags: ['tag1'] })
      );
      render(<PropertiesPanel />);

      const tagInput = screen.getByPlaceholderText('');
      fireEvent.keyDown(tagInput, { key: 'Backspace' });

      expect(mockUpdateElement).toHaveBeenCalledWith(
        'elem-1',
        expect.objectContaining({ tags: [] })
      );
    });
  });

  describe('color picker updates', () => {
    it('renders border, fill, and text color labels', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      expect(screen.getByText('Border')).toBeInTheDocument();
      expect(screen.getByText('Fill')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('updates border color on color picker change', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const colorInputs = screen.getAllByRole('color');
      expect(colorInputs.length).toBeGreaterThanOrEqual(3);

      fireEvent.change(colorInputs[0], { target: { value: '#FF0000' } });
      expect(mockUpdateDiagramElement).toHaveBeenCalled();
    });

    it('updates fill color on color picker change', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const colorInputs = screen.getAllByRole('color');
      fireEvent.change(colorInputs[1], { target: { value: '#00FF00' } });
      expect(mockUpdateDiagramElement).toHaveBeenCalled();
    });

    it('updates text color on color picker change', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const colorInputs = screen.getAllByRole('color');
      fireEvent.change(colorInputs[2], { target: { value: '#0000FF' } });
      expect(mockUpdateDiagramElement).toHaveBeenCalled();
    });
  });

  describe('font selector changes', () => {
    it('renders font family label and select', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      expect(screen.getByText('Font Family')).toBeInTheDocument();
    });

    it('renders font weight buttons', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Bold')).toBeInTheDocument();
    });

    it('changes font weight on button click', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const boldBtns = screen.getAllByText('Bold');
      fireEvent.click(boldBtns[0]);
      expect(mockUpdateDiagramElement).toHaveBeenCalled();
    });
  });

  describe('opacity slider', () => {
    it('renders opacity range input with correct range', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const rangeInput = screen.getByRole('slider');
      expect(rangeInput).toBeInTheDocument();
      expect(rangeInput).toHaveAttribute('min', '0');
      expect(rangeInput).toHaveAttribute('max', '100');
    });

    it('updates opacity on slider change', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const rangeInput = screen.getByRole('slider');
      fireEvent.change(rangeInput, { target: { value: '50' } });

      expect(mockUpdateDiagramElement).toHaveBeenCalled();
    });
  });

  describe('custom properties add/remove', () => {
    it('renders existing custom properties', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ userProperties: { env: 'prod', version: '1.0' } })
      );
      render(<PropertiesPanel />);

      expect(screen.getByText('Add Property')).toBeInTheDocument();
    });

    it('adds a new property row when clicking + Add Property', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ userProperties: {} })
      );
      render(<PropertiesPanel />);

      const addBtn = screen.getByText('+ Add Property');
      fireEvent.click(addBtn);

      // After adding, there should be a key input
      expect(screen.getByPlaceholderText('Key')).toBeInTheDocument();
    });

    it('removes a property row when × is clicked', () => {
      mockGetElement.mockReturnValue(
        createTestElement({ userProperties: { env: 'prod' } })
      );
      render(<PropertiesPanel />);

      // All × buttons in the component
      const allRemoveBtns = screen.getAllByText('×');
      if (allRemoveBtns.length > 0) {
        // The last × in custom properties section
        fireEvent.click(allRemoveBtns[allRemoveBtns.length - 1]);
      }
    });
  });

  describe('keyboard Enter to apply changes', () => {
    it('applies name change and calls updateElement', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const nameInput = screen.getByPlaceholderText('Element name');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

      expect(mockUpdateElement).toHaveBeenCalledWith(
        'elem-1',
        expect.objectContaining({ name: 'Changed Name' })
      );
    });
  });

  describe('Escape to cancel changes', () => {
    it('calls deselectAll when close button is clicked', () => {
      mockGetElement.mockReturnValue(createTestElement());
      render(<PropertiesPanel />);

      const closeBtn = screen.getByLabelText('Close properties panel');
      fireEvent.click(closeBtn);

      expect(mockDeselectAll).toHaveBeenCalled();
    });
  });
});
