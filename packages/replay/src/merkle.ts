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
