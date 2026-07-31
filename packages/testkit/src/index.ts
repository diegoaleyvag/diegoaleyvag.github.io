export const FIXED_LOGICAL_CLOCK_START = "2030-01-01T00:00:00.000Z";
export const FIXED_LOGICAL_CLOCK_STEP_MS = 1000;
export const REPLAY_GENERATOR_VERSION = "1.0.0";

export class FixedLogicalClock {
  readonly #startMs: number;

  public constructor(
    start = FIXED_LOGICAL_CLOCK_START,
    public readonly stepMs = FIXED_LOGICAL_CLOCK_STEP_MS,
  ) {
    this.#startMs = Date.parse(start);
    if (!Number.isFinite(this.#startMs) || stepMs < 1) {
      throw new Error("Fixed logical clock requires a valid start and step");
    }
  }

  public atSequence(sequence: number): string {
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new Error("Logical event sequence must be a positive integer");
    }
    return new Date(this.#startMs + (sequence - 1) * this.stepMs).toISOString();
  }
}

export function deterministicRunId(
  scenarioId: string,
  variant: string,
): `synthetic-run-${string}` {
  return `synthetic-run-${scenarioId}-${variant}`;
}

export function deterministicEventId(
  variant: string,
  eventType: string,
): `synthetic-event-${string}` {
  return `synthetic-event-${variant}-${eventType.replaceAll("_", "-")}`;
}
