import type { MerkleTreeNode } from "@portfolio/replay";

import { LAB_COPY } from "../copy";
import { shortenDigest } from "../format";
import {
  diffTreeNodeIds,
  findInclusionPath,
  flattenTree,
  layoutMerkleTree,
  type LayoutEdge,
  type LayoutNode,
} from "../merkle-layout";
import { Mark } from "./Mark";

export interface TamperOverlay {
  readonly tamperedTree: MerkleTreeNode;
  readonly sequence: number;
}

interface MerkleTreeProps {
  readonly tree: MerkleTreeNode;
  readonly selectedSequence: number | null;
  readonly tamper: TamperOverlay | null;
}

const COL_WIDTH = 108;
const ROW_HEIGHT = 92;
const MARGIN_X = 60;
const MARGIN_Y = 40;
const NODE_W = 76;
const NODE_H = 40;
const ROOT_NODE_W = 96;
const ROOT_NODE_H = 48;

function boxSize(node: LayoutNode): { width: number; height: number } {
  if (node.isRoot) {
    return { width: ROOT_NODE_W, height: ROOT_NODE_H };
  }
  return { width: NODE_W, height: NODE_H };
}

function edgeKind(
  edge: LayoutEdge,
  pathIds: ReadonlySet<string>,
  tamperedIds: ReadonlySet<string> | null,
): "tamper" | "path" | "plain" {
  if (tamperedIds?.has(edge.toId) && tamperedIds.has(edge.fromId)) {
    return "tamper";
  }
  if (pathIds.has(edge.toId) && pathIds.has(edge.fromId)) {
    return "path";
  }
  return "plain";
}

function nodeKind(
  node: LayoutNode,
  pathIds: ReadonlySet<string>,
  siblingIds: ReadonlySet<string>,
  tamperedIds: ReadonlySet<string> | null,
): "tamper" | "path" | "sibling" | "plain" {
  if (tamperedIds?.has(node.id)) {
    return "tamper";
  }
  if (pathIds.has(node.id)) {
    return "path";
  }
  if (siblingIds.has(node.id)) {
    return "sibling";
  }
  return "plain";
}

/**
 * A visual, RFC 6962-shaped Merkle tree for the currently loaded run.
 * Decorative (`aria-hidden`): every hash and pass/fail state it shows is
 * already available as accessible text in the evidence list and integrity
 * `Mark` above it, so the figure adds a spatial reading of the same facts
 * rather than a second, harder-to-reach source of them.
 */
export function MerkleTree({
  tree,
  selectedSequence,
  tamper,
}: MerkleTreeProps) {
  const layout = layoutMerkleTree(tree);
  const inclusion =
    selectedSequence !== null
      ? findInclusionPath(tree, selectedSequence)
      : null;
  const pathIds = inclusion?.pathIds ?? new Set<string>();
  const siblingIds = inclusion?.siblingIds ?? new Set<string>();
  const tamperedIds = tamper
    ? diffTreeNodeIds(tree, tamper.tamperedTree)
    : null;
  const tamperedById = tamper ? flattenTree(tamper.tamperedTree) : null;

  const width = MARGIN_X * 2 + (layout.columns - 1) * COL_WIDTH + ROOT_NODE_W;
  const height = MARGIN_Y * 2 + (layout.rows - 1) * ROW_HEIGHT + ROOT_NODE_H;

  const caption =
    tamper !== null
      ? LAB_COPY.merkleTreeCaptionTampered
      : selectedSequence !== null
        ? LAB_COPY.merkleTreeCaptionSelected
        : LAB_COPY.merkleTreeCaptionDefault;

  return (
    <figure class="merkle-tree">
      <figcaption>
        <span class="merkle-tree__number">
          {LAB_COPY.merkleTreeFigureLabel}
        </span>{" "}
        {caption}
      </figcaption>
      <div class="merkle-tree__scroll">
        <svg
          class="merkle-tree__svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          preserveAspectRatio="xMinYMid meet"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          {layout.edges.map((edge) => {
            const kind = edgeKind(edge, pathIds, tamperedIds);
            const from = toPixel(edge.from.x, edge.from.y);
            const to = toPixel(edge.to.x, edge.to.y);
            return (
              <line
                key={edge.id}
                class={`merkle-tree__edge merkle-tree__edge--${kind}`}
                x1={from.px}
                y1={from.py + boxHeightFor(edge.from.y === 0)}
                x2={to.px}
                y2={to.py - NODE_H / 2}
              />
            );
          })}
          {layout.nodes.map((node) => {
            const kind = nodeKind(node, pathIds, siblingIds, tamperedIds);
            const { px, py } = toPixel(node.x, node.y);
            const { width: boxW, height: boxH } = boxSize(node);
            const displayNode =
              kind === "tamper" && tamperedById
                ? (tamperedById.get(node.id) ?? null)
                : null;
            const sha256 = displayNode?.sha256 ?? node.sha256;
            return (
              <g
                key={node.id}
                class={`merkle-tree__node merkle-tree__node--${kind}`}
                transform={`translate(${px - boxW / 2}, ${py - boxH / 2})`}
              >
                <rect
                  class="merkle-tree__box"
                  width={boxW}
                  height={boxH}
                  rx="0"
                />
                {node.isRoot ? (
                  <text class="merkle-tree__label" x={boxW / 2} y={14}>
                    {LAB_COPY.merkleTreeRootLabel}
                  </text>
                ) : null}
                <text
                  class="merkle-tree__hash"
                  x={boxW / 2}
                  y={node.isRoot ? boxH - 12 : boxH / 2 + 5}
                >
                  {kind === "tamper" ? "\u2715 " : ""}
                  {node.isLeaf
                    ? String(node.sequence).padStart(2, "0")
                    : shortenDigest(sha256, 4, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul class="merkle-tree__legend">
        <li>
          <span class="merkle-tree__swatch merkle-tree__swatch--path" />
          {LAB_COPY.merkleTreeLegendPath}
        </li>
        <li>
          <span class="merkle-tree__swatch merkle-tree__swatch--sibling" />
          {LAB_COPY.merkleTreeLegendSibling}
        </li>
        <li>
          <span class="merkle-tree__swatch merkle-tree__swatch--tamper" />
          {LAB_COPY.merkleTreeLegendTamper}
        </li>
      </ul>
      {tamper !== null ? (
        <div class="merkle-tree__root-compare">
          <p>
            <span class="merkle-tree__root-label">
              {LAB_COPY.merkleTreeRecordedRootLabel}
            </span>{" "}
            <span class="mono">{shortenDigest(tree.sha256)}</span>
          </p>
          <p>
            <span class="merkle-tree__root-label">
              {LAB_COPY.merkleTreeRecomputedRootLabel}
            </span>{" "}
            <span class="mono">
              {shortenDigest(tamper.tamperedTree.sha256)}
            </span>
          </p>
          <Mark
            tone="fail"
            glyph={"\u2260"}
            label={LAB_COPY.merkleTreeRootMismatchLabel}
          />
        </div>
      ) : null}
    </figure>
  );
}

function toPixel(x: number, y: number): { px: number; py: number } {
  return { px: MARGIN_X + x * COL_WIDTH, py: MARGIN_Y + y * ROW_HEIGHT };
}

function boxHeightFor(isRoot: boolean): number {
  return (isRoot ? ROOT_NODE_H : NODE_H) / 2;
}
