# ADR 0010: Limit Merkle evidence to relative integrity

- Status: Accepted
- Date: 2026-08-01

## Context

A browser can recompute event hashes and an inclusion path. However, when the
event, root, proof, verification code, and any public key all arrive from the
same GitHub Pages origin, that check does not establish an independent trust
anchor. Calling the result authentic, immutable, truthful, or policy-compliant
would overstate the mechanism.

The demo still benefits from a real, inspectable tamper-detection construction.

## Decision

- Canonicalize event objects with RFC 8785 JSON Canonicalization Scheme.
- Use RFC 6962-style domain separation:
  `SHA-256(0x00 || canonical event bytes)` for leaves and
  `SHA-256(0x01 || left hash || right hash)` for interior nodes.
- Follow RFC 6962's largest-power-of-two tree split and do not duplicate an
  unpaired final leaf.
- Store the root and inclusion paths in each versioned `RunBundle`.
- Recompute a selected proof in the browser and provide a labelled in-memory
  tamper demonstration.
- Use this exact success claim:
  “Integrity check passed: this event matches the Merkle root included in this
  replay bundle.”
- Display beside it:
  “This demonstrates tamper detection relative to the included root. Because
  the bundle and root are served by the same origin, it does not prove the event
  is true, policy-compliant, independently witnessed, or immune to origin
  compromise.”
- Do not describe résumé claims as cryptographically verified.
- Do not add a signature in the first slice; a same-origin signature would not
  change the trust conclusion.

## Consequences

- The browser demonstrates a real integrity primitive without making a false
  security promise.
- Negative tests must mutate event content, sequence, sibling, and root.
- A future independent release key, transparency log, or separately published
  root could support a stronger claim only through a new threat analysis and
  ADR.
- “Authentic,” “immutable,” “trustless,” “verified résumé,” and “compliance
  proved” remain prohibited for the current design.
