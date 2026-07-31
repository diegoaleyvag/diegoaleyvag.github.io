import type { EventEvidence, RunEvent } from "@portfolio/contracts";
import { describe, expect, it } from "vitest";

import { buildMerkleEvidence, verifyEventProof } from "../src/index.ts";

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
