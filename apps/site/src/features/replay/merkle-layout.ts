import type { MerkleTreeNode } from "@portfolio/replay";

/**
 * Pure geometry for the Merkle tree diagram: turns a {@link MerkleTreeNode}
 * into positioned nodes and edges an SVG can render directly. Kept separate
 * from `MerkleTree.tsx` so the coordinate math has no Preact dependency.
 *
 * `x` is the midpoint of the leaf-index range each node covers (so leaves
 * land at their sequence position and every ancestor centers over its
 * children); `y` is tree depth, root at 0. Because RFC 6962 pairs the
 * largest power-of-two prefix first, an uneven event count produces leaves
 * at more than one depth — the layout renders that real shape rather than
 * forcing a balanced diagram.
 */
export interface LayoutNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly sha256: string;
  readonly sequence: number | null;
  readonly isLeaf: boolean;
  readonly isRoot: boolean;
}

export interface LayoutEdge {
  readonly id: string;
  readonly fromId: string;
  readonly toId: string;
  readonly from: { readonly x: number; readonly y: number };
  readonly to: { readonly x: number; readonly y: number };
}

export interface MerkleTreeLayout {
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
  readonly columns: number;
  readonly rows: number;
}

function nodeX(node: MerkleTreeNode): number {
  return (node.start + node.end - 1) / 2;
}

export function layoutMerkleTree(root: MerkleTreeNode): MerkleTreeLayout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  let maxDepth = 0;

  const visit = (node: MerkleTreeNode): void => {
    maxDepth = Math.max(maxDepth, node.depth);
    nodes.push({
      id: node.id,
      x: nodeX(node),
      y: node.depth,
      sha256: node.sha256,
      sequence: node.sequence,
      isLeaf: node.children === null,
      isRoot: node.depth === 0,
    });
    if (node.children !== null) {
      for (const child of node.children) {
        edges.push({
          id: `${node.id}->${child.id}`,
          fromId: node.id,
          toId: child.id,
          from: { x: nodeX(node), y: node.depth },
          to: { x: nodeX(child), y: child.depth },
        });
        visit(child);
      }
    }
  };

  visit(root);

  return {
    nodes,
    edges,
    columns: root.end - root.start,
    rows: maxDepth + 1,
  };
}

function findNodeBySequence(
  node: MerkleTreeNode,
  sequence: number,
): MerkleTreeNode | null {
  if (node.sequence === sequence) {
    return node;
  }
  if (node.children === null) {
    return null;
  }
  for (const child of node.children) {
    const found = findNodeBySequence(child, sequence);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

/**
 * The inclusion path for `sequence`: every ancestor id from the leaf up to
 * (and including) the root, plus the sibling id at each level a real
 * inclusion proof would need to recompute that ancestor's hash.
 */
export interface InclusionPath {
  readonly pathIds: ReadonlySet<string>;
  readonly siblingIds: ReadonlySet<string>;
}

export function findInclusionPath(
  root: MerkleTreeNode,
  sequence: number,
): InclusionPath {
  const pathIds = new Set<string>();
  const siblingIds = new Set<string>();

  const target = findNodeBySequence(root, sequence);
  if (target === null) {
    return { pathIds, siblingIds };
  }

  const walk = (node: MerkleTreeNode): boolean => {
    if (node.id === target.id) {
      pathIds.add(node.id);
      return true;
    }
    if (node.children === null) {
      return false;
    }
    const [left, right] = node.children;
    const onLeft = walk(left);
    const onRight = onLeft ? false : walk(right);
    if (onLeft || onRight) {
      pathIds.add(node.id);
      siblingIds.add(onLeft ? right.id : left.id);
      return true;
    }
    return false;
  };

  walk(root);
  return { pathIds, siblingIds };
}

/** Every node in `root`, keyed by its stable `start:end` id. */
export function flattenTree(
  root: MerkleTreeNode,
): ReadonlyMap<string, MerkleTreeNode> {
  const map = new Map<string, MerkleTreeNode>([[root.id, root]]);
  if (root.children !== null) {
    for (const child of root.children) {
      for (const [id, value] of flattenTree(child)) {
        map.set(id, value);
      }
    }
  }
  return map;
}

/** Ids of every node whose hash differs between two same-shaped trees. */
export function diffTreeNodeIds(
  original: MerkleTreeNode,
  changed: MerkleTreeNode,
): ReadonlySet<string> {
  const changedIds = new Set<string>();

  const walk = (a: MerkleTreeNode, b: MerkleTreeNode): void => {
    if (a.sha256 !== b.sha256) {
      changedIds.add(a.id);
    }
    if (a.children !== null && b.children !== null) {
      walk(a.children[0], b.children[0]);
      walk(a.children[1], b.children[1]);
    }
  };

  walk(original, changed);
  return changedIds;
}
