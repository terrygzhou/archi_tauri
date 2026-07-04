import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useModelStore } from '../../stores/modelStore';
import { useDiagramStore } from '../../stores/diagramStore';
import { ArchiMateElement } from '../../types/domain';
import {
  ArchiMateLayer,
  ArchiMateElementType,
  LAYER_COLORS,
  FOLDER_HIERARCHY,
} from '../../types/archimate';

// ============================================================================
// Layer labels
// ============================================================================

const LAYER_LABELS: Record<ArchiMateLayer, string> = {
  strategy: 'Strategy',
  business: 'Business',
  application: 'Application',
  technology: 'Technology',
  physical: 'Physical',
  implementation: 'Implementation',
  motivation: 'Motivation',
  other: 'Other',
};

const LAYER_ORDER: ArchiMateLayer[] = [
  'strategy',
  'business',
  'application',
  'technology',
  'physical',
  'implementation',
  'motivation',
  'other',
];

// ============================================================================
// Element icon mapping
// ============================================================================

const ELEMENT_ICONS: Record<string, string> = {
  // Strategy
  capability: '⬡',
  means: '🔧',
  outcome: '🎯',
  'value-stream': '🔄',
  'course-of-action': '➡',
  stakeholder: '👤',
  goal: '🚩',
  constraint: '⚠',
  assessment: '📊',
  value: '💎',
  representation: '📋',
  resource: '📦',
  'capability-group': '⬡⬡',
  'strategic-goal': '🏆',
  'strategic-objective': '🎯',
  'business-case': '📄',
  initiative: '🚀',
  roadmap: '🗺',
  portfolio: '📁',
  domain: '🌐',
  'capability-matrix': '📊',
  'value-proposition': '💡',
  // Business
  'business-actor': '👤',
  'business-collaboration': '🤝',
  'business-event': '⚡',
  'business-function': '⬡',
  'business-interaction': '💬',
  'business-interface': '🔌',
  'business-object': '📄',
  'business-process': '⚙',
  'business-role': '🎭',
  'business-service': '🛎',
  'business-location': '📍',
  // Application
  'application-collaboration': '🤝',
  'application-component': '📦',
  'application-event': '⚡',
  'application-function': '⬡',
  'application-interaction': '💬',
  'application-interface': '🔌',
  'application-process': '⚙',
  'application-service': '🛎',
  // Technology
  'technology-collaboration': '🤝',
  'technology-component': '📦',
  'technology-event': '⚡',
  'technology-function': '⬡',
  'technology-interaction': '💬',
  'technology-interface': '🔌',
  'technology-process': '⚙',
  'technology-service': '🛎',
  node: '🖥',
  'communication-network': '🌐',
  // Physical
  facility: '🏢',
  equipment: '🔩',
  'system-software': '💿',
  'communication-path': '📡',
  'distribution-network': '🔗',
  product: '📦',
  // Implementation
  'work-package': '📋',
  plateau: '⬛',
  gap: '⬜',
  contract: '📝',
  deliverable: '📤',
  'implementation-event': '⚡',
  // Motivation
  driver: '🔥',
  principle: '📜',
  requirement: '✅',
  motive: '💭',
  objective: '🎯',
  quality: '⭐',
  'value-driver': '📈',
  dependency: '🔗',
  tradeoff: '⚖',
  concern: '❓',
  risk: '⚠',
  opportunity: '🌟',
  incentive: '🎁',
  compliance: '🔒',
  standard: '📏',
  benchmark: '📊',
  milestone: '🚩',
  vision: '🔭',
  aspiration: '🌠',
  'ethical-value': '⚖',
  'regulatory-constraint': '⛔',
  'market-driver': '📈',
  // Other
  grouping: '📂',
  junction: '⚡',
  'data-object': '🗄',
  material: '🧱',
  artifact: '📄',
  'line-connection': '〰',
  note: '📝',
};

function getIcon(type: string): string {
  return ELEMENT_ICONS[type] || '◆';
}

// ============================================================================
// Format element type to readable label
// ============================================================================

function formatType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ============================================================================
// Types
// ============================================================================

interface TreeNode {
  id: string;
  label: string;
  type: 'model' | 'layer' | 'element' | 'diagram' | 'relationship';
  element?: ArchiMateElement;
  layer?: ArchiMateLayer;
  children?: TreeNode[];
  depth: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: TreeNode | null;
}

// ============================================================================
// Explorer Component
// ============================================================================

export interface ExplorerProps {
  className?: string;
  expanded?: boolean;
}

export const Explorer: React.FC<ExplorerProps> = ({
  className = '',
  expanded: _expanded = true,
}) => {
  const { model, addElement, updateElement, deleteElement, getElement, getElements } = useModelStore();
  const { selectElement, deselectAll, selectedElementIds } = useDiagramStore();

  // ── State ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(['model-root']),
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [dragNode, setDragNode] = useState<TreeNode | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const treeRef = useRef<HTMLDivElement>(null);

  // ── Derived data ─────────────────────────────────────────────
  const searchLower = searchQuery.toLowerCase();
  const isSearching = searchQuery.length > 0;

  // Expand all layers when searching
  useEffect(() => {
    if (isSearching) {
      const next = new Set(expandedNodes);
      next.add('model-root');
      LAYER_ORDER.forEach((l) => next.add(`layer-${l}`));
      setExpandedNodes(next);
    }
  }, [isSearching]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build tree nodes
  const treeNodes = useMemo((): TreeNode[] => {
    if (!model) return [];

    const nodes: TreeNode[] = [];
    const allEls = model.elements;
    const filtered = isSearching
      ? allEls.filter(
          (el) =>
            el.name.toLowerCase().includes(searchLower) ||
            el.type.toLowerCase().includes(searchLower) ||
            el.tags.some((t) => t.toLowerCase().includes(searchLower)),
        )
      : allEls;

    // Group elements by layer
    const byLayer = new Map<ArchiMateLayer, ArchiMateElement[]>();
    filtered.forEach((el) => {
      const layer = el.layer;
      if (!byLayer.has(layer)) byLayer.set(layer, []);
      byLayer.get(layer)!.push(el);
    });

    // Root model node
    nodes.push({
      id: 'model-root',
      label: model.name,
      type: 'model',
      depth: 0,
    });

    // Layer folders
    for (const layer of LAYER_ORDER) {
      const layerEls = byLayer.get(layer) ?? [];
      const layerChildren: TreeNode[] = layerEls.map((el) => ({
        id: el.id,
        label: el.name,
        type: 'element' as const,
        element: el,
        layer,
        depth: 2,
      }));

      nodes.push({
        id: `layer-${layer}`,
        label: LAYER_LABELS[layer],
        type: 'layer',
        layer,
        children: layerChildren,
        depth: 1,
      });
    }

    return nodes;
  }, [model, isSearching, searchLower]);

  // ── Toggle expand ────────────────────────────────────────────
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // ── Select element ───────────────────────────────────────────
  const selectElementById = useCallback(
    (elementId: string) => {
      selectElement(elementId);
    },
    [selectElement],
  );

  // ── Context menu ─────────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: TreeNode) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handler);
      document.addEventListener('contextmenu', handler);
    }
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [contextMenu.visible, closeContextMenu]);

  // ── Create element ───────────────────────────────────────────
  const handleCreateElement = useCallback(
    (type: ArchiMateElementType) => {
      closeContextMenu();
      const targetLayer = contextMenu.node?.type === 'layer' && contextMenu.node.layer
        ? contextMenu.node.layer
        : undefined;

      const id = addElement(type, targetLayer ? undefined : undefined);
      if (id) {
        selectElementById(id);
      }
    },
    [addElement, closeContextMenu, contextMenu.node, selectElementById],
  );

  // ── Delete element ───────────────────────────────────────────
  const handleDeleteElement = useCallback(
    (id: string) => {
      closeContextMenu();
      deleteElement(id);
      if (selectedElementIds.includes(id)) deselectAll();
    },
    [closeContextMenu, deleteElement, selectedElementIds, deselectAll],
  );

  // ── Duplicate element ────────────────────────────────────────
  const handleDuplicateElement = useCallback(
    (el: ArchiMateElement) => {
      closeContextMenu();
      const newEl = {
        ...el,
        name: el.name + ' (Copy)',
        tags: [...el.tags],
        stereotypes: [...el.stereotypes],
      };
      const id = addElement(el.type, {
        name: newEl.name,
        tags: newEl.tags,
        stereotypes: newEl.stereotypes,
        documentation: el.documentation,
        userProperties: newEl.userProperties ? { ...newEl.userProperties } : {},
      });
      if (id) selectElementById(id);
    },
    [closeContextMenu, addElement, selectElementById],
  );

  // ── Rename element ───────────────────────────────────────────
  const handleRename = useCallback(
    (id: string, newName: string) => {
      updateElement(id, { name: newName, modified: new Date().toISOString() });
      setRenamingId(null);
    },
    [updateElement],
  );

  const startRename = useCallback((node: TreeNode) => {
    closeContextMenu();
    if (node.type === 'element' && node.element) {
      setRenamingId(node.id);
      setRenameValue(node.element.name);
    }
  }, [closeContextMenu]);

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.DragEvent, node: TreeNode) => {
      if (node.type !== 'element') {
        e.preventDefault();
        return;
      }
      setDragNode(node);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.id);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(targetId);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDropTarget(null);
      if (!dragNode || dragNode.type !== 'element') return;

      // If dropping on a layer, move element to that layer
      if (targetId.startsWith('layer-')) {
        const layer = targetId.replace('layer-', '') as ArchiMateLayer;
        updateElement(dragNode.id, { layer, modified: new Date().toISOString() });
      }
      setDragNode(null);
    },
    [dragNode, updateElement],
  );

  // ── Keyboard navigation ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, node: TreeNode) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (node.type === 'element') selectElementById(node.id);
          else toggleNode(node.id);
          break;
        case 'F2':
          e.preventDefault();
          if (node.type === 'element') startRename(node);
          break;
        case 'Delete':
          e.preventDefault();
          if (node.type === 'element' && node.element) handleDeleteElement(node.id);
          break;
      }
    },
    [toggleNode, selectElementById, startRename, handleDeleteElement],
  );

  // ── No model ─────────────────────────────────────────────────
  if (!model) {
    return (
      <div style={styles.root} className={`explorer ${className}`}>
        <div style={styles.header}>
          <span style={styles.title}>Model Explorer</span>
        </div>
        <div style={styles.emptyState}>No model loaded</div>
      </div>
    );
  }

  // ── Compute search result count ────────────────────────────
  const searchResultCount = useMemo(
    () =>
      treeNodes
        .filter((n) => n.type === 'layer')
        .reduce((count, n) => count + (n.children?.length ?? 0), 0),
    [treeNodes],
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={styles.root} className={`explorer ${className}`}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Model Explorer</span>
      </div>

      {/* Model info */}
      <div style={styles.modelInfo}>
        <span style={styles.modelName}>{model.name}</span>
        <span style={styles.modelMeta}>
          {model.elements.length} elements · {model.relationships.length} rels · {model.diagrams.length} diagrams
        </span>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search elements..."
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.searchClear} onClick={() => setSearchQuery('')}>
            ×
          </button>
        )}
      </div>

      {/* Search results info */}
      {isSearching && (
        <div style={styles.searchResults}>
          {searchResultCount} results
        </div>
      )}

      {/* Tree */}
      <div style={styles.treeContainer} ref={treeRef}>
        {treeNodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            expanded={expandedNodes.has(node.id)}
            isDropTarget={dropTarget === node.id}
            isSearching={isSearching}
            searchResultCount={searchResultCount}
            selectedElementIds={selectedElementIds}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onToggle={() => toggleNode(node.id)}
            onSelect={selectElementById}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedItem(node.id)}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.node && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={closeContextMenu}
          onCreateElement={handleCreateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onRename={startRename}
        />
      )}

      {/* Rename inline input overlay */}
      {renamingId && (
        <InlineRename
          id={renamingId}
          value={renameValue}
          onChange={setRenameValue}
          onSubmit={() => {
            handleRename(renamingId, renameValue);
          }}
          onCancel={() => setRenamingId(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Tree Node Component
// ============================================================================

interface TreeNodeComponentProps {
  node: TreeNode;
  expanded: boolean;
  isDropTarget: boolean;
  isSearching: boolean;
  searchResultCount: number;
  selectedElementIds: string[];
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
  onDragStart: (e: React.DragEvent, node: TreeNode) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, node: TreeNode) => void;
  onFocus: () => void;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  expanded,
  isDropTarget,
  isSearching,
  searchResultCount,
  selectedElementIds,
  renamingId,
  renameValue,
  setRenameValue,
  onToggle,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onKeyDown,
  onFocus,
}) => {
  const isSelected = node.type === 'element' && selectedElementIds.includes(node.id);
  const layerColor = node.layer ? LAYER_COLORS[node.layer] : undefined;
  const icon = node.type === 'element' ? getIcon(node.element?.type ?? '') : undefined;
  const hasChildren = node.children && node.children.length > 0;
  const shouldShowExpand =
    node.type === 'model' ||
    (node.type === 'layer' && hasChildren) ||
    (isSearching && node.type === 'layer');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'element') {
      onSelect(node.id);
    } else if (shouldShowExpand) {
      onToggle();
    }
  };

  if (node.type === 'model') {
    return (
      <div
        style={{
          ...styles.treeItem,
          paddingLeft: node.depth * 16,
          fontWeight: 700,
          fontSize: 13,
          backgroundColor: isDropTarget ? '#E3F2FD' : 'transparent',
        }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.id)}
      >
        <span style={styles.expandIcon}>
          {shouldShowExpand ? (expanded ? '−' : '+') : ''}
        </span>
        <span style={styles.nodeIcon}>📁</span>
        <span style={{ ...styles.nodeLabel, flex: 1 }}>{node.label}</span>
        <span style={styles.elementCount}>
          {isSearching ? searchResultCount : useModelStore.getState().model?.elements.length ?? 0}
        </span>
      </div>
    );
  }

  if (node.type === 'layer') {
    const totalElements = node.children?.length ?? 0;
    return (
      <>
        <div
          style={{
            ...styles.treeItem,
            ...styles.layerItem,
            paddingLeft: node.depth * 16,
            borderLeft: `3px solid ${layerColor}`,
            backgroundColor: isDropTarget
              ? `${layerColor}22`
              : 'transparent',
          }}
          onClick={handleClick}
          onContextMenu={(e) => onContextMenu(e, node)}
          onDragOver={(e) => onDragOver(e, node.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, node.id)}
        >
          <span style={styles.expandIcon}>
            {shouldShowExpand ? (expanded ? '−' : '+') : ''}
          </span>
          <span
            style={{
              ...styles.layerIndicator,
              backgroundColor: layerColor,
            }}
          />
          <span style={{ ...styles.nodeLabel, fontWeight: 600 }}>{node.label}</span>
          <span style={styles.elementCount}>
            {totalElements > 0 ? totalElements : ''}
          </span>
        </div>

        {expanded && node.children?.map((child) => (
          <TreeNodeComponent
            key={child.id}
            node={child}
            expanded={false}
            isDropTarget={false}
            isSearching={isSearching}
            searchResultCount={searchResultCount}
            selectedElementIds={selectedElementIds}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onToggle={onToggle}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
          />
        ))}
      </>
    );
  }

  // Element node
  return (
    <div
      style={{
        ...styles.treeItem,
        ...styles.elementItem,
        paddingLeft: node.depth * 16,
        backgroundColor: isSelected
          ? '#E3F2FD'
          : isDropTarget
            ? '#E3F2FD66'
            : 'transparent',
      }}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, node)}
      onKeyDown={(e) => onKeyDown(e, node)}
      onFocus={onFocus}
      draggable={true}
      onDragStart={(e) => onDragStart(e, node)}
      tabIndex={0}
    >
      <span style={styles.expandIcon} />
      {node.element && (
        <span style={styles.layerIndicatorSmall}>
          <span
            style={{
              ...styles.elementDot,
              backgroundColor: LAYER_COLORS[node.element.layer],
            }}
          />
        </span>
      )}
      <span style={styles.elementIcon}>{icon}</span>
      <span style={styles.nodeLabel}>{node.label}</span>
      <span style={styles.elementType}>
        {node.element ? formatType(node.element.type) : ''}
      </span>
    </div>
  );
};

// ============================================================================
// Context Menu
// ============================================================================

interface ContextMenuProps {
  x: number;
  y: number;
  node: TreeNode;
  onClose: () => void;
  onCreateElement: (type: ArchiMateElementType) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: ArchiMateElement) => void;
  onRename: (node: TreeNode) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  onClose,
  onCreateElement,
  onDeleteElement,
  onDuplicateElement,
  onRename,
}) => {
  const [showNewElementSubmenu, setShowNewElementSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Group element types by layer for the submenu
  const groupedTypes = useMemo(() => {
    const groups: { layer: ArchiMateLayer; types: readonly ArchiMateElementType[] }[] = [];
    for (const layer of LAYER_ORDER) {
      const types = FOLDER_HIERARCHY[layer];
      if (types.length > 0) {
        groups.push({ layer, types });
      }
    }
    return groups;
  }, []);

  return (
    <>
      {/* Backdrop to close menu */}
      <div style={styles.contextBackdrop} onClick={onClose} />

      <div
        ref={menuRef}
        style={{
          ...styles.contextMenu,
          left: x,
          top: y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* New Element submenu */}
        <div style={styles.menuItemRow}>
          <div
            style={styles.menuItem}
            onMouseEnter={() => setShowNewElementSubmenu(true)}
            onClick={() => setShowNewElementSubmenu(!showNewElementSubmenu)}
          >
            <span style={styles.menuIcon}>➕</span>
            <span>New Element</span>
            <span style={styles.menuArrow}>›</span>
          </div>
          {showNewElementSubmenu && (
            <div style={styles.submenu}>
              <div style={styles.submenuTitle}>
                <span>Create Element</span>
                <span style={styles.submenuHint}>Click to create</span>
              </div>
              {groupedTypes.map(({ layer, types }) => (
                <div key={layer} style={styles.submenuGroup}>
                  <div
                    style={{
                      ...styles.submenuGroupHeader,
                      borderLeft: `3px solid ${LAYER_COLORS[layer]}`,
                    }}
                  >
                    {LAYER_LABELS[layer]} ({types.length})
                  </div>
                  {types.map((type) => (
                    <div
                      key={type}
                      style={styles.submenuItem}
                      onClick={() => {
                        onCreateElement(type);
                      }}
                    >
                      <span style={styles.submenuIcon}>{getIcon(type)}</span>
                      <span>{formatType(type)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        {node.type === 'element' && (
          <>
            <div style={styles.menuSeparator} />

            {/* Duplicate */}
            {node.element && (
              <div
                style={styles.menuItem}
                onClick={() => onDuplicateElement(node.element!)}
              >
                <span style={styles.menuIcon}>📋</span>
                <span>Duplicate</span>
              </div>
            )}

            {/* Rename */}
            <div style={styles.menuItem} onClick={() => onRename(node)}>
              <span style={styles.menuIcon}>✏</span>
              <span>Rename</span>
            </div>

            {/* Separator */}
            <div style={styles.menuSeparator} />

            {/* Delete */}
            <div
              style={{ ...styles.menuItem, ...styles.deleteItem }}
              onClick={() =>
                node.type === 'element' && onDeleteElement(node.id)
              }
            >
              <span style={styles.menuIcon}>🗑</span>
              <span>Delete</span>
            </div>
          </>
        )}

        {/* New element options when on layer */}
        {node.type === 'layer' && (
          <div style={styles.menuSeparator} />
        )}
      </div>
    </>
  );
};

// ============================================================================
// Inline Rename
// ============================================================================

interface InlineRenameProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const InlineRename: React.FC<InlineRenameProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div style={styles.inlineRename}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={onSubmit}
        style={styles.inlineRenameInput}
      />
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  // Root
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    color: '#333',
    borderRight: '1px solid #E0E0E0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
  },
  modelInfo: {
    padding: '8px 14px',
    borderBottom: '1px solid #E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  modelName: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
    marginBottom: 2,
  },
  modelMeta: {
    fontSize: 11,
    color: '#888',
  },
  // Search
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    gap: 6,
    borderBottom: '1px solid #E8E8E8',
  },
  searchIcon: {
    fontSize: 13,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    border: '1px solid #D0D0D0',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    outline: 'none',
    backgroundColor: '#FFF',
  },
  searchClear: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#999',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  searchResults: {
    padding: '4px 14px',
    fontSize: 11,
    color: '#888',
    borderBottom: '1px solid #E8E8E8',
  },
  // Empty
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
  // Tree
  treeContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 12,
    gap: 4,
    transition: 'background-color 0.1s',
    userSelect: 'none' as const,
  },
  treeItemHover: {
    backgroundColor: '#F0F0F0',
  },
  layerItem: {
    fontWeight: 500,
  },
  elementItem: {
    fontSize: 12,
  },
  expandIcon: {
    width: 16,
    textAlign: 'center' as const,
    fontSize: 10,
    color: '#666',
    flexShrink: 0,
  },
  nodeIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  elementIcon: {
    fontSize: 14,
    flexShrink: 0,
    width: 18,
    textAlign: 'center' as const,
  },
  nodeLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  layerIndicator: {
    width: 3,
    height: 16,
    borderRadius: 2,
    flexShrink: 0,
  },
  layerIndicatorSmall: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: 10,
  },
  elementDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  elementType: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
    flexShrink: 0,
  },
  elementCount: {
    fontSize: 10,
    color: '#999',
    background: '#F0F0F0',
    borderRadius: 8,
    padding: '1px 6px',
    flexShrink: 0,
    minWidth: 16,
    textAlign: 'center' as const,
  },
  // Context menu
  contextBackdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  contextMenu: {
    position: 'fixed' as const,
    zIndex: 1000,
    backgroundColor: '#FFF',
    border: '1px solid #D0D0D0',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: 200,
    maxHeight: 400,
    overflowY: 'auto' as const,
  },
  menuItemRow: {
    position: 'relative' as const,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#333',
  },
  menuIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center' as const,
  },
  menuArrow: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#999',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#E8E8E8',
    margin: '4px 0',
  },
  deleteItem: {
    color: '#E53935',
  },
  // Submenu
  submenu: {
    position: 'absolute' as const,
    left: '100%',
    top: 0,
    backgroundColor: '#FFF',
    border: '1px solid #D0D0D0',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: 240,
    maxHeight: 400,
    overflowY: 'auto' as const,
    zIndex: 1001,
  },
  submenuTitle: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '8px 12px',
    borderBottom: '1px solid #E8E8E8',
    fontSize: 12,
    fontWeight: 600,
  },
  submenuHint: {
    fontSize: 10,
    fontWeight: 400,
    color: '#999',
  },
  submenuGroup: {
    marginBottom: 4,
  },
  submenuGroupHeader: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    color: '#888',
    padding: '4px 12px',
    letterSpacing: '0.5px',
  },
  submenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px 4px 16px',
    fontSize: 11,
    cursor: 'pointer',
    color: '#333',
  },
  submenuIcon: {
    fontSize: 13,
    width: 18,
    textAlign: 'center' as const,
  },
  // Inline rename
  inlineRename: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  inlineRenameInput: {
    padding: '6px 12px',
    border: '2px solid #1976D2',
    borderRadius: 4,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    maxWidth: 300,
  },
};

export default Explorer;
