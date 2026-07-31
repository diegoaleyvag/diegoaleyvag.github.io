# Replay data and browser-safe verification

Stage 2 consumes the generated data through these exports:

- `REPLAY_MANIFEST_PATH`: `/replays/v1/manifest.json`
- `SYNTHETIC_MAINTENANCE_BUNDLE_ROOT_PATH`:
  `/replays/v1/synthetic-maintenance-v1/`
- `loadReplayManifest(fetcher?)`: schema-validates the static manifest.
- `loadReplayBundle(entry, fetcher?)`: fetches bytes, verifies exact length and
  SHA-256, then parses and validates `RunBundle`.
- `verifyRunBundleEvent(bundle, sequence)`: verifies one RFC 6962-style
  inclusion proof over RFC 8785 canonical event bytes.

`tools/build-replays` is the sole producer for files under
`apps/site/public/replays/`. It evaluates the pinned Rego source, builds all
bundles in memory, validates them, then atomically replaces the output
directory. A policy or schema failure writes nothing.

An event proof establishes only that the event matches the root included in the
same replay bundle. The bundle and root share one origin, so this mechanism does
not establish truth, policy compliance, independent witnessing, or protection
from a compromised origin.
