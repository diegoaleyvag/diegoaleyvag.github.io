import type { RunBundle, RunEvent } from "@portfolio/contracts";

/**
 * Returns a deep, in-memory clone of `bundle` with the event at `sequence`
 * mutated. Used only to demonstrate that the browser's Merkle inclusion
 * check fails on a tampered copy. Never touches the fetched bytes, the
 * checked-in artifact, or any other in-memory copy.
 */
export function tamperEventCopy(
  bundle: RunBundle,
  sequence: number,
): RunBundle {
  // A JSON round-trip clone is sufficient (and maximally compatible) because
  // RunBundle is plain JSON data; it was itself produced by JSON.parse.
  const clone = JSON.parse(JSON.stringify(bundle)) as RunBundle;
  const events = clone.events as RunEvent[];
  const index = sequence - 1;
  const original = events[index];
  if (original === undefined) {
    throw new Error(`No event exists at sequence ${sequence}`);
  }
  events[index] = {
    ...original,
    summary: `${original.summary} (tampered copy)`,
  };
  return clone;
}
