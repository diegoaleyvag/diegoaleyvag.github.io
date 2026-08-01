import type { EventEvidence, RunBundle, RunEvent } from "@portfolio/contracts";

import { canonicalJsonBytes } from "./canonical-json.ts";
import {
  bytesToHex,
  concatenateBytes,
  hexToBytes,
  sha256Bytes,
} from "./crypto.ts";

const LEAF_PREFIX = Uint8Array.of(0x00);
const NODE_PREFIX = Uint8Array.of(0x01);

export interface BuiltMerkleEvidence {
  readonly rootSha256: string;
  readonly events: readonly EventEvidence[];
}

/**
 * One node of a fully reconstructed Merkle tree, exposed (unlike
 * {@link BuiltMerkleEvidence}) for diagram rendering rather than proof
 * checking. `start`/`end` are the half-open range of event indices (0-based)
 * the node covers; leaves have `end - start === 1`. `id` is a stable
 * `start:end` key a caller can use to key diagram elements or diff two trees
 * built from different event copies.
 */
export interface MerkleTreeNode {
  readonly id: string;
  readonly sha256: string;
  readonly start: number;
  readonly end: number;
  readonly depth: number;
  readonly sequence: number | null;
  readonly children: readonly [MerkleTreeNode, MerkleTreeNode] | null;
}

async function hashLeaf(event: RunEvent): Promise<Uint8Array> {
  return sha256Bytes(concatenateBytes(LEAF_PREFIX, canonicalJsonBytes(event)));
}

async function hashNode(
  left: Uint8Array,
  right: Uint8Array,
): Promise<Uint8Array> {
  return sha256Bytes(concatenateBytes(NODE_PREFIX, left, right));
}

function largestPowerOfTwoLessThan(value: number): number {
  let power = 1;
  while (power * 2 < value) {
    power *= 2;
  }
  return power;
}

export async function buildMerkleEvidence(
  events: readonly RunEvent[],
): Promise<BuiltMerkleEvidence> {
  if (events.length === 0) {
    throw new Error("A Merkle tree requires at least one event");
  }

  const leaves = await Promise.all(events.map((event) => hashLeaf(event)));
  const roots = new Map<string, Promise<Uint8Array>>();

  const rootForRange = (start: number, end: number): Promise<Uint8Array> => {
    const key = `${start}:${end}`;
    const existing = roots.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const result = (async (): Promise<Uint8Array> => {
      const size = end - start;
      if (size === 1) {
        const leaf = leaves[start];
        if (leaf === undefined) {
          throw new Error(`Missing Merkle leaf at index ${start}`);
        }
        return leaf;
      }
      const split = largestPowerOfTwoLessThan(size);
      return hashNode(
        await rootForRange(start, start + split),
        await rootForRange(start + split, end),
      );
    })();
    roots.set(key, result);
    return result;
  };

  const proofForIndex = async (
    index: number,
    start: number,
    end: number,
  ): Promise<EventEvidence["proof"]> => {
    const size = end - start;
    if (size === 1) {
      return [];
    }

    const split = largestPowerOfTwoLessThan(size);
    const midpoint = start + split;
    if (index < midpoint) {
      const childProof = await proofForIndex(index, start, midpoint);
      const sibling = await rootForRange(midpoint, end);
      return [
        ...childProof,
        { position: "right", sha256: bytesToHex(sibling) },
      ];
    }

    const childProof = await proofForIndex(index, midpoint, end);
    const sibling = await rootForRange(start, midpoint);
    return [...childProof, { position: "left", sha256: bytesToHex(sibling) }];
  };

  const root = await rootForRange(0, events.length);
  const eventEvidence = await Promise.all(
    leaves.map(async (leaf, index): Promise<EventEvidence> => ({
      sequence: index + 1,
      leaf_sha256: bytesToHex(leaf),
      proof: await proofForIndex(index, 0, events.length),
    })),
  );

  return {
    rootSha256: bytesToHex(root),
    events: eventEvidence,
  };
}

/**
 * Reconstructs the same RFC 6962-style tree as {@link buildMerkleEvidence},
 * but returns its full shape (every internal node's hash, not just each
 * leaf's flattened proof) for rendering a Merkle tree diagram. Two trees
 * built from event lists that differ only in one event's content still share
 * every other node's `id`, so a caller can diff two `MerkleTreeNode` trees by
 * `id` to find exactly which ancestors changed.
 */
export async function buildMerkleTreeView(
  events: readonly RunEvent[],
): Promise<MerkleTreeNode> {
  if (events.length === 0) {
    throw new Error("A Merkle tree requires at least one event");
  }

  const leaves = await Promise.all(events.map((event) => hashLeaf(event)));

  const build = async (
    start: number,
    end: number,
    depth: number,
  ): Promise<MerkleTreeNode> => {
    const id = `${start}:${end}`;
    const size = end - start;
    if (size === 1) {
      const leaf = leaves[start];
      const event = events[start];
      if (leaf === undefined || event === undefined) {
        throw new Error(`Missing Merkle leaf at index ${start}`);
      }
      return {
        id,
        sha256: bytesToHex(leaf),
        start,
        end,
        depth,
        sequence: event.sequence,
        children: null,
      };
    }

    const split = largestPowerOfTwoLessThan(size);
    const [left, right] = await Promise.all([
      build(start, start + split, depth + 1),
      build(start + split, end, depth + 1),
    ]);
    const hash = await hashNode(
      hexToBytes(left.sha256),
      hexToBytes(right.sha256),
    );
    return {
      id,
      sha256: bytesToHex(hash),
      start,
      end,
      depth,
      sequence: null,
      children: [left, right],
    };
  };

  return build(0, events.length, 0);
}

export async function verifyEventProof(
  event: RunEvent,
  evidence: EventEvidence,
  rootSha256: string,
): Promise<boolean> {
  let current = await hashLeaf(event);
  if (bytesToHex(current) !== evidence.leaf_sha256) {
    return false;
  }

  try {
    for (const step of evidence.proof) {
      const sibling = hexToBytes(step.sha256);
      current =
        step.position === "left"
          ? await hashNode(sibling, current)
          : await hashNode(current, sibling);
    }
  } catch {
    return false;
  }

  return bytesToHex(current) === rootSha256;
}

export async function verifyRunBundleEvent(
  bundle: RunBundle,
  sequence: number,
): Promise<boolean> {
  const event = bundle.events[sequence - 1];
  const evidence = bundle.evidence.events[sequence - 1];
  if (
    event === undefined ||
    evidence === undefined ||
    event.sequence !== sequence ||
    evidence.sequence !== sequence
  ) {
    return false;
  }
  return verifyEventProof(event, evidence, bundle.evidence.root_sha256);
}
