import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useModelStore } from '../../stores/modelStore';
import { useDiagramStore } from '../../stores/diagramStore';
import { useCommandStack } from '../../stores/commandStack';
import { ArchiMateElement, DiagramElement } from '../../types/domain';
import { ArchiMateLayer, LAYER_COLORS } from '../../types/archimate';
import { CommandType } from '../../stores/commandStack';

// ============================================================================
// Types
// ============================================================================

interface TagInputRef {
  el?: HTMLInputElement;
}

interface CustomProperty {
  key: string;
  value: string;
}

interface ElementStyleState {
  borderColor: string;
  fillColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  opacity: number;
  lineWidth: number;
  zIndex: number;
  locked: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const FONTS = [
  'Inter, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Times New Roman, serif',
  'system-ui, sans-serif',
];

const FONT_WEIGHTS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Medium', value: '500' },
  { label: 'Bold', value: 'bold' },
];

const FONT_STYLES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
];

const TEXT_ALIGNMENTS = [
  { label: 'Left', value: 'left', icon: '◧' },
  { label: 'Center', value: 'center', icon: '◨' },
  { label: 'Right', value: 'right', icon: '◩' },
];

const LINE_WIDTHS = [1, 2, 3, 4, 5];

// ============================================================================
// Tag Input Component
// ============================================================================

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  renderTag?: (tag: string) => React.ReactNode;
  tagClassName?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onAdd,
  onRemove,
  placeholder = 'Add...',
  renderTag,
  tagClassName = 'prop-tag',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault();
        const val = inputValue.trim();
        if (val && !tags.includes(val)) {
          onAdd(val);
          setInputValue('');
        }
      }
      if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        onRemove(tags[tags.length - 1]);
      }
    },
    [inputValue, tags, onAdd, onRemove],
  );

  const handleBlur = useCallback(() => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      onAdd(val);
    }
    setInputValue('');
  }, [inputValue, tags, onAdd]);

  return (
    <div style={styles.tagContainer}>
      {tags.map((tag, i) => (
        <span key={`${tag}-${i}`} style={styles.tag} className={tagClassName}>
          {renderTag ? renderTag(tag) : tag}
          <button
            style={styles.tagRemove}
            onClick={() => onRemove(tag)}
            tabIndex={-1}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          ...styles.tagInput,
          width: tags.length === 0 ? '100%' : '80px',
          flex: tags.length === 0 ? 1 : undefined,
        }}
      />
    </div>
  );
};

// ============================================================================
// Section Component
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Section: React.FC<SectionProps> = ({ title, children, style }) => (
  <div style={{ ...styles.section, ...style }}>
    <div style={styles.sectionTitle}>{title}</div>
    <div style={styles.sectionBody}>{children}</div>
  </div>
);

// ============================================================================
// Color Picker Component
// ============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div style={styles.colorPickerRow}>
    <span style={styles.colorLabel}>{label}</span>
    <div style={styles.colorPreviewWrapper}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.colorInput}
      />
      <div style={{ ...styles.colorPreview, backgroundColor: value }} />
    </div>
  </div>
);

// ============================================================================
// Custom Properties Editor
// ============================================================================

const CustomPropertiesEditor: React.FC<{
  properties: Record<string, string>;
  onUpdate: (props: Record<string, string>) => void;
}> = ({ properties, onUpdate }) => {
  const [rows, setRows] = useState<CustomProperty[]>(() =>
    Object.entries(properties).map(([key, value]) => ({ key, value })),
  );

  useEffect(() => {
    setRows(Object.entries(properties).map(([key, value]) => ({ key, value })));
  }, [properties]);

  const commit = useCallback(() => {
    const propMap: Record<string, string> = {};
    rows.forEach((r) => {
      if (r.key) propMap[r.key] = r.value;
    });
    onUpdate(propMap);
  }, [rows, onUpdate]);

  const addRow = () => setRows((r) => [...r, { key: '', value: '' }]);

  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: 'key' | 'value', val: string) =>
    setRows((r) => {
      const next = [...r];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });

  return (
    <div>
      <div style={styles.propertyTable}>
        <div style={styles.propertyTableHeader}>
          <span style={{ ...styles.propCol, width: '45%' }}>Key</span>
          <span style={{ ...styles.propCol, width: '45%' }}>Value</span>
          <span style={{ ...styles.propCol, width: '10%', textAlign: 'center' }}></span>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={styles.propertyTableRow}>
            <input
              type="text"
              value={row.key}
              onChange={(e) => updateRow(i, 'key', e.target.value)}
              onBlur={commit}
              placeholder="Key"
              style={styles.propInput}
            />
            <input
              type="text"
              value={row.value}
              onChange={(e) => updateRow(i, 'value', e.target.value)}
              onBlur={commit}
              placeholder="Value"
              style={styles.propInput}
            />
            <button
              style={styles.propRemoveBtn}
              onClick={() => removeRow(i)}
              aria-label="Remove property"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button style={styles.addPropertyBtn} onClick={addRow}>
        + Add Property
      </button>
    </div>
  );
};

// ============================================================================
// Properties Panel
// ============================================================================

export interface PropertiesPanelProps {
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  className = '',
}) => {
  const { model, getElement, updateElement } = useModelStore();
  const { selectedElementIds, activeDiagram, updateDiagramElement, deselectAll } =
    useDiagramStore();
  const { execute: executeCommand } = useCommandStack();

  const selectedElement = useMemo(
    () => (selectedElementIds.length > 0 ? getElement(selectedElementIds[0]) ?? null : null),
    [selectedElementIds, getElement],
  );

  // ── No model ──────────────────────────────────────────────────
  if (!model) {
    return (
      <div style={styles.panelRoot} className={`properties-panel ${className}`}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Properties</h3>
        </div>
        <div style={styles.emptyState}>No model loaded</div>
      </div>
    );
  }

  // ── No selection ──────────────────────────────────────────────
  if (!selectedElement) {
    return (
      <div style={styles.panelRoot} className={`properties-panel ${className}`}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Properties</h3>
        </div>
        <div style={styles.emptyState}>Select an element to edit properties</div>
      </div>
    );
  }

  // ── Resolve diagram element for style data ────────────────────
  const diagramElement = activeDiagram?.elements.find(
    (de) => de.elementId === selectedElement.id,
  );

  return (
    <div style={styles.panelRoot} className={`properties-panel ${className}`}>
      {/* Header */}
      <div style={styles.panelHeader}>
        <h3 style={styles.panelTitle}>Properties</h3>
        <button
          style={styles.closeBtn}
          onClick={() => deselectAll()}
          aria-label="Close properties panel"
        >
          ×
        </button>
      </div>

      {/* Scrollable content */}
      <div style={styles.scrollContent}>
        <ElementProperties
          element={selectedElement}
          diagramElement={diagramElement}
          onUpdate={updateElement}
          onDiagramUpdate={updateDiagramElement}
          executeCommand={executeCommand}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Element Properties Form
// ============================================================================

interface ElementPropertiesProps {
  element: ArchiMateElement;
  diagramElement?: DiagramElement;
  onUpdate: (id: string, updates: Partial<ArchiMateElement>) => void;
  onDiagramUpdate: (
    id: string,
    updates: Partial<DiagramElement>,
  ) => void;
  executeCommand: (cmd: {
    type: CommandType;
    label: string;
    execute: () => void;
    undo: () => void;
  }) => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({
  element,
  diagramElement: _diagramElement,
  onUpdate,
  onDiagramUpdate,
  executeCommand,
}) => {
  const layerColor = LAYER_COLORS[element.layer] || '#666666';
  const layerLabel = element.layer.charAt(0).toUpperCase() + element.layer.slice(1);

  // ── Wrapped update helpers ─────────────────────────────────────
  const handleUpdate = useCallback(
    (updates: Partial<ArchiMateElement>) => {
      const label = `Update ${element.type}`;
      executeCommand({
        type: 'UPDATE_ELEMENT',
        label,
        execute: () => onUpdate(element.id, updates),
        undo: () => {
          // Revert: we store current state in metadata
          onUpdate(element.id, updates as any);
        },
      });
      onUpdate(element.id, updates);
    },
    [element, onUpdate, executeCommand],
  );

  // ── Name ───────────────────────────────────────────────────────
  const [name, setName] = useState(element.name);
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      onUpdate(element.id, { name: e.target.value, modified: new Date().toISOString() });
    },
    [element.id, onUpdate],
  );

  // ── Documentation ──────────────────────────────────────────────
  const [doc, setDoc] = useState(element.documentation ?? '');
  const handleDocChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDoc(e.target.value);
      onUpdate(element.id, { documentation: e.target.value, modified: new Date().toISOString() });
    },
    [element.id, onUpdate],
  );

  // ── Tags ───────────────────────────────────────────────────────
  const handleAddTag = useCallback(
    (tag: string) => {
      onUpdate(element.id, { tags: [...element.tags, tag], modified: new Date().toISOString() });
    },
    [element.id, element.tags, onUpdate],
  );
  const handleRemoveTag = useCallback(
    (tag: string) => {
      onUpdate(
        element.id,
        { tags: element.tags.filter((t) => t !== tag), modified: new Date().toISOString() },
      );
    },
    [element.id, element.tags, onUpdate],
  );

  // ── Stereotypes ────────────────────────────────────────────────
  const handleAddStereotype = useCallback(
    (stereo: string) => {
      onUpdate(
        element.id,
        { stereotypes: [...element.stereotypes, stereo], modified: new Date().toISOString() },
      );
    },
    [element.id, element.stereotypes, onUpdate],
  );
  const handleRemoveStereotype = useCallback(
    (stereo: string) => {
      onUpdate(
        element.id,
        {
          stereotypes: element.stereotypes.filter((s) => s !== stereo),
          modified: new Date().toISOString(),
        },
      );
    },
    [element.id, element.stereotypes, onUpdate],
  );

  // ── Custom properties (userProperties) ─────────────────────────
  const handleUserPropertiesUpdate = useCallback(
    (props: Record<string, string>) => {
      onUpdate(element.id, { userProperties: props, modified: new Date().toISOString() });
    },
    [element.id, onUpdate],
  );

  // ── Style state ────────────────────────────────────────────────
  const cs = _diagramElement?.customStyle ?? {};
  const [style, setStyle] = useState<ElementStyleState>({
    borderColor: (cs.borderColor as string) || '#333333',
    fillColor: (cs.fillColor as string) || layerColor,
    textColor: (cs.textColor as string) || '#FFFFFF',
    fontFamily: (cs.fontFamily as string) || 'Inter, sans-serif',
    fontSize: Number(cs.fontSize) || 14,
    fontWeight: (cs.fontWeight as string) || 'normal',
    fontStyle: (cs.fontStyle as string) || 'normal',
    textAlign: (cs.textAlign as string) || 'center',
    opacity: Number(cs.opacity) ?? 100,
    lineWidth: Number(cs.lineWidth) ?? 1,
    zIndex: Number(_diagramElement?.zIndex ?? 0),
    locked: Boolean(_diagramElement?.locked),
  });

  const handleStyleChange = useCallback(
    (updates: Partial<ElementStyleState>) => {
      const newStyle = { ...style, ...updates };
      setStyle(newStyle);
      const customStyle: Record<string, unknown> = {
        borderColor: newStyle.borderColor,
        fillColor: newStyle.fillColor,
        textColor: newStyle.textColor,
        fontFamily: newStyle.fontFamily,
        fontSize: newStyle.fontSize,
        fontWeight: newStyle.fontWeight,
        fontStyle: newStyle.fontStyle,
        textAlign: newStyle.textAlign,
        opacity: newStyle.opacity,
        lineWidth: newStyle.lineWidth,
      };
      onDiagramUpdate(element.id, {
        customStyle,
        zIndex: newStyle.zIndex,
        locked: newStyle.locked,
      });
    },
    [style, element.id, onDiagramUpdate],
  );

  // Re-sync when element ref changes
  useEffect(() => {
    setName(element.name);
  }, [element.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Z-order helpers ────────────────────────────────────────────
  const handleBringForward = () => handleStyleChange({ zIndex: style.zIndex + 1 });
  const handleSendBack = () => handleStyleChange({ zIndex: Math.max(0, style.zIndex - 1) });

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* ── Identity ─────────────────────────────────────────── */}
      <Section title="Identity">
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Name <span style={styles.required}>*</span></span>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            style={styles.textInput}
            placeholder="Element name"
            minLength={1}
          />
        </label>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Type</span>
          <span style={styles.badge}>{formatType(element.type)}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Layer</span>
          <span
            style={{
              ...styles.layerBadge,
              backgroundColor: layerColor,
            }}
          >
            {layerLabel}
          </span>
        </div>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>ID</span>
          <code style={styles.codeText}>{element.id}</code>
        </div>
      </Section>

      {/* ── Documentation ────────────────────────────────────── */}
      <Section title="Description">
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Documentation</span>
          <textarea
            value={doc}
            onChange={handleDocChange}
            style={styles.textarea}
            placeholder="Add documentation..."
            rows={3}
          />
        </label>
      </Section>

      {/* ── Tags ─────────────────────────────────────────────── */}
      <Section title="Tags">
        <TagInput
          tags={element.tags}
          onAdd={handleAddTag}
          onRemove={handleRemoveTag}
          placeholder="Add tag and press Enter"
        />
      </Section>

      {/* ── Stereotypes ──────────────────────────────────────── */}
      <Section title="Stereotypes">
        <TagInput
          tags={element.stereotypes}
          onAdd={handleAddStereotype}
          onRemove={handleRemoveStereotype}
          placeholder="Add stereotype"
          renderTag={(tag) => `«${tag}»`}
        />
      </Section>

      {/* ── Custom Properties ────────────────────────────────── */}
      <Section title="Custom Properties">
        <CustomPropertiesEditor
          properties={element.userProperties ?? {}}
          onUpdate={handleUserPropertiesUpdate}
        />
      </Section>

      {/* ── Colors ───────────────────────────────────────────── */}
      <Section title="Colors">
        <ColorPicker
          label="Border"
          value={style.borderColor}
          onChange={(v) => handleStyleChange({ borderColor: v })}
        />
        <ColorPicker
          label="Fill"
          value={style.fillColor}
          onChange={(v) => handleStyleChange({ fillColor: v })}
        />
        <ColorPicker
          label="Text"
          value={style.textColor}
          onChange={(v) => handleStyleChange({ textColor: v })}
        />
      </Section>

      {/* ── Font ─────────────────────────────────────────────── */}
      <Section title="Font">
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Font Family</span>
          <select
            value={style.fontFamily}
            onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
            style={styles.selectInput}
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f.split(',')[0]}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Font Size</span>
          <input
            type="number"
            value={style.fontSize}
            min={8}
            max={72}
            onChange={(e) => handleStyleChange({ fontSize: Number(e.target.value) })}
            style={styles.numberInput}
          />
        </label>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Weight</span>
          <div style={styles.buttonGroup}>
            {FONT_WEIGHTS.map((fw) => (
              <button
                key={fw.value}
                style={
                  style.fontWeight === fw.value ? styles.btnActive : styles.btn
                }
                onClick={() => handleStyleChange({ fontWeight: fw.value })}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Style</span>
          <div style={styles.buttonGroup}>
            {FONT_STYLES.map((fs) => (
              <button
                key={fs.value}
                style={
                  style.fontStyle === fs.value ? styles.btnActive : styles.btn
                }
                onClick={() => handleStyleChange({ fontStyle: fs.value })}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Text Alignment ───────────────────────────────────── */}
      <Section title="Text Alignment">
        <div style={styles.buttonGroup}>
          {TEXT_ALIGNMENTS.map((ta) => (
            <button
              key={ta.value}
              style={
                style.textAlign === ta.value
                  ? { ...styles.btnActive, ...styles.textAlignBtn }
                  : { ...styles.btn, ...styles.textAlignBtn }
              }
              onClick={() => handleStyleChange({ textAlign: ta.value })}
              title={ta.label}
            >
              {ta.icon}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Opacity ──────────────────────────────────────────── */}
      <Section title="Opacity">
        <div style={styles.opacityRow}>
          <input
            type="range"
            min={0}
            max={100}
            value={style.opacity}
            onChange={(e) => handleStyleChange({ opacity: Number(e.target.value) })}
            style={styles.rangeInput}
          />
          <span style={styles.rangeValue}>{style.opacity}%</span>
        </div>
      </Section>

      {/* ── Line Width ───────────────────────────────────────── */}
      <Section title="Line Width">
        <div style={styles.buttonGroup}>
          {LINE_WIDTHS.map((w) => (
            <button
              key={w}
              style={
                style.lineWidth === w
                  ? styles.btnActive
                  : styles.btn
              }
              onClick={() => handleStyleChange({ lineWidth: w })}
            >
              <div
                style={{
                  width: 24,
                  height: w,
                  backgroundColor: '#333',
                  borderRadius: 1,
                }}
              />
            </button>
          ))}
          <span style={styles.rangeValue}>
            {style.lineWidth}px
          </span>
        </div>
      </Section>

      {/* ── Z-Order ──────────────────────────────────────────── */}
      <Section title="Z-Order">
        <div style={styles.zOrderRow}>
          <button
            style={styles.btn}
            onClick={handleBringForward}
            title="Bring Forward"
          >
            ▲ Bring Forward
          </button>
          <button
            style={styles.btn}
            onClick={handleSendBack}
            title="Send Back"
          >
            ▼ Send Back
          </button>
          <span style={styles.zIndexLabel}>Z: {style.zIndex}</span>
        </div>
      </Section>

      {/* ── Lock / Unlock ────────────────────────────────────── */}
      <Section title="Lock">
        <button
          style={
            style.locked ? styles.lockBtnLocked : styles.lockBtnUnlocked
          }
          onClick={() => handleStyleChange({ locked: !style.locked })}
        >
          {style.locked ? '🔒 Locked' : '🔓 Unlocked'}
        </button>
      </Section>

      {/* ── Timestamps ───────────────────────────────────────── */}
      <Section title="Timestamps">
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Created</span>
          <span>{new Date(element.created).toLocaleString()}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Modified</span>
          <span>{new Date(element.modified).toLocaleString()}</span>
        </div>
      </Section>
    </>
  );
};

// ============================================================================
// Formatting helpers
// ============================================================================

function formatType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  panelRoot: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#FAFAFA',
    borderLeft: '1px solid #E0E0E0',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    color: '#333',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  panelTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#999',
    padding: '2px 6px',
    borderRadius: 3,
  },
  scrollContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: 13,
    padding: '20px',
    textAlign: 'center',
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#888',
    padding: '8px 14px 4px',
  },
  sectionBody: {
    padding: '0 14px 8px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#555',
  },
  textInput: {
    padding: '5px 8px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textarea: {
    padding: '6px 8px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  selectInput: {
    padding: '5px 8px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    backgroundColor: '#fff',
  },
  numberInput: {
    padding: '5px 8px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    width: '100%',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
    fontSize: 11,
    fontWeight: 500,
    color: '#555',
  },
  layerBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    color: '#fff',
  },
  required: {
    color: '#E53935',
  },
  codeText: {
    fontFamily: 'Courier New, monospace',
    fontSize: 11,
    color: '#666',
    wordBreak: 'break-all',
  },
  // Tag input
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    padding: '5px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    minHeight: 32,
    alignItems: 'center',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 6px',
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    color: '#1565C0',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    marginLeft: 2,
  },
  tagInput: {
    border: 'none',
    outline: 'none',
    fontSize: 12,
    flex: 1,
    minWidth: 60,
    padding: '2px 4px',
    backgroundColor: 'transparent',
  },
  // Color picker
  colorPickerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  colorLabel: {
    fontSize: 12,
    color: '#555',
  },
  colorPreviewWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  colorInput: {
    width: 28,
    height: 28,
    padding: 0,
    border: '1px solid #ccc',
    borderRadius: 4,
    cursor: 'pointer',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  // Buttons
  buttonGroup: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '4px 10px',
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    backgroundColor: '#FFF',
    fontSize: 12,
    cursor: 'pointer',
    color: '#333',
  },
  btnActive: {
    padding: '4px 10px',
    border: '1px solid #1976D2',
    borderRadius: 4,
    backgroundColor: '#1976D2',
    fontSize: 12,
    cursor: 'pointer',
    color: '#FFF',
  },
  textAlignBtn: {
    width: 36,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  },
  // Opacity
  opacityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    accentColor: '#1976D2',
  },
  rangeValue: {
    fontSize: 12,
    color: '#555',
    minWidth: 36,
    textAlign: 'center' as const,
  },
  // Z-order
  zOrderRow: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  zIndexLabel: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
  },
  // Lock
  lockBtnLocked: {
    padding: '6px 16px',
    border: '1px solid #E53935',
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
    fontSize: 12,
    cursor: 'pointer',
    color: '#C62828',
    width: '100%',
  },
  lockBtnUnlocked: {
    padding: '6px 16px',
    border: '1px solid #43A047',
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    fontSize: 12,
    cursor: 'pointer',
    color: '#2E7D32',
    width: '100%',
  },
  // Custom properties
  propertyTable: {
    marginBottom: 6,
  },
  propertyTableHeader: {
    display: 'flex',
    fontWeight: 600,
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  propCol: {
    fontSize: 11,
  },
  propertyTableRow: {
    display: 'flex',
    gap: 4,
    marginBottom: 3,
    alignItems: 'center',
  },
  propInput: {
    flex: 1,
    padding: '4px 6px',
    border: '1px solid #D0D0D0',
    borderRadius: 3,
    fontSize: 12,
    outline: 'none',
  },
  propRemoveBtn: {
    background: 'none',
    border: 'none',
    color: '#E53935',
    cursor: 'pointer',
    fontSize: 16,
    padding: '2px 4px',
  },
  addPropertyBtn: {
    padding: '4px 10px',
    border: '1px dashed #B0B0B0',
    borderRadius: 4,
    backgroundColor: 'transparent',
    fontSize: 12,
    cursor: 'pointer',
    color: '#555',
    width: '100%',
  },
};

export default PropertiesPanel;
