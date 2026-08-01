import type { EventEvidence, RunEvent } from "@portfolio/contracts";
import { describe, expect, it } from "vitest";

import {
  buildMerkleEvidence,
  buildMerkleTreeView,
  type MerkleTreeNode,
  verifyEventProof,
} from "../src/index.ts";

const events: RunEvent[] = Array.from({ length: 5 }, (_, index) => ({
  sequence: index + 1,
  event_id: `synthetic-event-merkle-${index + 1}`,
  logical_time: `2030-01-01T00:00:0${index}.000Z`,
  type: "run_started",
  summary: `Synthetic Merkle event ${index + 1}.`,
  data: {
    scenario_id: "synthetic-merkle-test-v1",
    variant: "proof-shape",
  },
}));

function replaceFirstHexCharacter(value: string): string {
  return `${value.startsWith("0") ? "1" : "0"}${value.slice(1)}`;
}

function collectLeaves(node: MerkleTreeNode): MerkleTreeNode[] {
  if (node.children === null) {
    return [node];
  }
  const [left, right] = node.children;
  return [...collectLeaves(left), ...collectLeaves(right)];
}

function ancestorChain(
  node: MerkleTreeNode,
  sequence: number,
): MerkleTreeNode[] | null {
  if (node.sequence === sequence) {
    return [node];
  }
  if (node.children === null) {
    return null;
  }
  for (const child of node.children) {
    const chain = ancestorChain(child, sequence);
    if (chain !== null) {
      return [node, ...chain];
    }
  }
  return null;
}

function nodesById(node: MerkleTreeNode): Map<string, MerkleTreeNode> {
  const map = new Map<string, MerkleTreeNode>([[node.id, node]]);
  if (node.children !== null) {
    for (const child of node.children) {
      for (const [id, value] of nodesById(child)) {
        map.set(id, value);
      }
    }
  }
  return map;
}

describe("RFC 6962-style Merkle evidence", () => {
  it("builds and verifies proofs without duplicating an unpaired leaf", async () => {
    const built = await buildMerkleEvidence(events);

    expect(built.events).toHaveLength(events.length);
    await Promise.all(
      events.map(async (event, index) => {
        const evidence = built.events[index];
        expect(evidence).toBeDefined();
        await expect(
          verifyEventProof(event, evidence!, built.rootSha256),
        ).resolves.toBe(true);
      }),
    );
  });

  it("rejects an event body mutation", async () => {
    const built = await buildMerkleEvidence(events);
    const event = events[2];
    const evidence = built.events[2];
    if (event === undefined || evidence === undefined) {
      throw new Error("Merkle test fixture is incomplete");
    }

    await expect(
      verifyEventProof(
        { ...event, summary: "Tampered synthetic event." },
        evidence,
        built.rootSha256,
      ),
    ).resolves.toBe(false);
  });

  it("rejects a sequence mutation", async () => {
    const built = await buildMerkleEvidence(events);
    const event = events[1];
    const evidence = built.events[1];
    if (event === undefined || evidence === undefined) {
      throw new Error("Merkle test fixture is incomplete");
    }

    await expect(
      verifyEventProof({ ...event, sequence: 99 }, evidence, built.rootSha256),
    ).resolves.toBe(false);
  });

  it("rejects a sibling mutation", async () => {
    const built = await buildMerkleEvidence(events);
    const event = events[4];
    const evidence = built.events[4];
    const firstStep = evidence?.proof[0];
    if (
      event === undefined ||
      evidence === undefined ||
      firstStep === undefined
    ) {
      throw new Error("Merkle test proof is incomplete");
    }

    const mutated: EventEvidence = {
      ...evidence,
      proof: [
        {
          ...firstStep,
          sha256: replaceFirstHexCharacter(firstStep.sha256),
        },
        ...evidence.proof.slice(1),
      ],
    };

    await expect(
      verifyEventProof(event, mutated, built.rootSha256),
    ).resolves.toBe(false);
  });

  it("rejects a root mutation", async () => {
    const built = await buildMerkleEvidence(events);
    const event = events[0];
    const evidence = built.events[0];
    if (event === undefined || evidence === undefined) {
      throw new Error("Merkle test fixture is incomplete");
    }

    await expect(
      verifyEventProof(
        event,
        evidence,
        replaceFirstHexCharacter(built.rootSha256),
      ),
    ).resolves.toBe(false);
  });
});

describe("Merkle tree diagram view", () => {
  it("matches the leaf digests and root produced by buildMerkleEvidence", async () => {
    const [built, tree] = await Promise.all([
      buildMerkleEvidence(events),
      buildMerkleTreeView(events),
    ]);

    expect(tree.sha256).toBe(built.rootSha256);
    expect(tree.depth).toBe(0);
    expect(tree.children).not.toBeNull();

    const leaves = collectLeaves(tree);
    expect(leaves).toHaveLength(events.length);
    leaves.forEach((leaf, index) => {
      expect(leaf.sequence).toBe(index + 1);
      expect(leaf.sha256).toBe(built.events[index]?.leaf_sha256);
      expect(leaf.children).toBeNull();
    });
  });

  it("changes only a tampered leaf's ancestors, leaving the rest of the tree's ids and hashes untouched", async () => {
    const tampered = events.map((event, index) =>
      index === 2 ? { ...event, summary: "Tampered synthetic event." } : event,
    );

    const [originalTree, tamperedTree] = await Promise.all([
      buildMerkleTreeView(events),
      buildMerkleTreeView(tampered),
    ]);

    const chain = ancestorChain(originalTree, 3);
    if (chain === null) {
      throw new Error("Expected sequence 3 to exist in the fixture tree");
    }
    const expectedChangedIds = new Set(chain.map((node) => node.id));

    const originalById = nodesById(originalTree);
    const tamperedById = nodesById(tamperedTree);
    expect(new Set(tamperedById.keys())).toEqual(new Set(originalById.keys()));

    const actuallyChangedIds = new Set<string>();
    for (const [id, original] of originalById) {
      const next = tamperedById.get(id);
      if (next !== undefined && next.sha256 !== original.sha256) {
        actuallyChangedIds.add(id);
      }
    }

    expect(actuallyChangedIds).toEqual(expectedChangedIds);
    expect(tamperedTree.sha256).not.toBe(originalTree.sha256);
  });
});
