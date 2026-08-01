import { verifyRunBundleEvent, type MerkleTreeNode } from "@portfolio/replay";
import type { RunBundle } from "@portfolio/contracts";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { INTEGRITY_MARKS, LAB_COPY } from "../copy";
import { formatLogicalTime, shortenDigest } from "../format";
import { tamperEventCopy } from "../tamper";
import type { IntegrityResultState, TamperResultState } from "../types";
import { Mark } from "./Mark";
import { MerkleTree, type TamperOverlay } from "./MerkleTree";

interface EventDetailsProps {
  readonly bundle: RunBundle;
  readonly sequence: number;
  readonly onClose: () => void;
  readonly shouldFocusOnMount: boolean;
  readonly tree: MerkleTreeNode | null;
  readonly tamper: TamperResultState;
  readonly tamperOverlay: TamperOverlay | null;
  readonly onTamper: (sequence: number, tamperedCopy: RunBundle) => void;
}

export function EventDetails({
  bundle,
  sequence,
  onClose,
  shouldFocusOnMount,
  tree,
  tamper,
  tamperOverlay,
  onTamper,
}: EventDetailsProps) {
  const event = bundle.events[sequence - 1];
  const evidence = bundle.evidence.events[sequence - 1];

  const [integrity, setIntegrity] = useState<IntegrityResultState>({
    status: "checking",
  });
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // This panel renders after the full event ledger (a "following details
    // region" per docs/design-direction.md). Moving focus here on a manual
    // selection keeps it reachable without tabbing past every remaining
    // ledger row. The dependency is `sequence` alone (not
    // `shouldFocusOnMount`) so pausing playback — which flips that flag
    // without changing `sequence` — never re-triggers this and yanks focus
    // around; each `sequence` change still reads the flag's current value,
    // so an autoplay-driven step correctly skips focusing.
    if (shouldFocusOnMount) {
      panelRef.current?.focus();
    }
  }, [sequence]);

  useEffect(() => {
    let cancelled = false;
    setIntegrity({ status: "checking" });

    verifyRunBundleEvent(bundle, sequence)
      .then((matches) => {
        if (!cancelled) {
          setIntegrity({ status: matches ? "pass" : "fail" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIntegrity({ status: "fail" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bundle, sequence]);

  const runTamperDemo = useCallback(() => {
    const tamperedCopy = tamperEventCopy(bundle, sequence);
    onTamper(sequence, tamperedCopy);
  }, [bundle, sequence, onTamper]);

  if (event === undefined || evidence === undefined) {
    return null;
  }

  return (
    <section
      ref={panelRef}
      id="event-details-panel"
      class="event-details"
      aria-labelledby="event-details-heading"
      tabIndex={-1}
    >
      <div class="event-details__head">
        <h3 id="event-details-heading">
          {LAB_COPY.eventDetailsHeading}
          {" \u00b7 "}
          {String(sequence).padStart(2, "0")}
        </h3>
        <button type="button" onClick={onClose}>
          {LAB_COPY.closeDetailsLabel}
        </button>
      </div>
      <p class="mono">{formatLogicalTime(event.logical_time)}</p>

      <details>
        <summary>{LAB_COPY.rawEventJsonSummary}</summary>
        <pre class="raw-json">{JSON.stringify(event, null, 2)}</pre>
      </details>

      <div class="evidence-block">
        <h4>{LAB_COPY.evidenceHeading}</h4>
        <dl>
          <dt>{LAB_COPY.evidenceCanonicalizationLabel}</dt>
          <dd>{bundle.evidence.canonicalization}</dd>
          <dt>{LAB_COPY.evidenceHashAlgorithmLabel}</dt>
          <dd>{bundle.evidence.hash_algorithm}</dd>
          <dt>{LAB_COPY.evidenceMerkleLabel}</dt>
          <dd>{bundle.evidence.merkle_construction}</dd>
          <dt>{LAB_COPY.evidenceTreeSizeLabel}</dt>
          <dd>{bundle.evidence.tree_size}</dd>
          <dt>{LAB_COPY.evidenceLeafLabel}</dt>
          <dd
            class="mono"
            title={evidence.leaf_sha256}
            aria-label={evidence.leaf_sha256}
          >
            {shortenDigest(evidence.leaf_sha256)}
          </dd>
          <dt>{LAB_COPY.evidenceRootLabel}</dt>
          <dd
            class="mono"
            title={bundle.evidence.root_sha256}
            aria-label={bundle.evidence.root_sha256}
          >
            {shortenDigest(bundle.evidence.root_sha256)}
          </dd>
        </dl>

        <div class="integrity-result" role="status" aria-live="polite">
          {integrity.status === "checking" ? (
            <p>{LAB_COPY.integrityCheckingMessage}</p>
          ) : null}
          {integrity.status === "pass" ? (
            <p>
              <Mark
                tone="pass"
                glyph={INTEGRITY_MARKS.pass}
                label={LAB_COPY.integrityPassMessage}
              />
            </p>
          ) : null}
          {integrity.status === "fail" ? (
            <p>
              <Mark
                tone="fail"
                glyph={INTEGRITY_MARKS.fail}
                label={LAB_COPY.integrityFailMessage}
              />
            </p>
          ) : null}
          <p class="integrity-result__qualifier">
            {LAB_COPY.evidenceLimitQualifier}
          </p>
        </div>
      </div>

      <div class="tamper-section">
        <h4>{LAB_COPY.tamperHeading}</h4>
        <p>{LAB_COPY.tamperDescription}</p>
        <button type="button" onClick={runTamperDemo}>
          {LAB_COPY.tamperButtonLabel}
        </button>
        <div class="tamper-result" role="status" aria-live="polite">
          {tamper.status === "checking" ? (
            <p>{LAB_COPY.tamperCheckingMessage}</p>
          ) : null}
          {tamper.status === "failed-as-expected" ? (
            <p>
              <Mark
                tone="fail"
                glyph={INTEGRITY_MARKS.fail}
                label={LAB_COPY.tamperFailedAsExpectedMessage}
              />
            </p>
          ) : null}
          {tamper.status === "unexpectedly-passed" ? (
            <p role="alert">{LAB_COPY.tamperUnexpectedlyPassedMessage}</p>
          ) : null}
        </div>
      </div>

      {tree !== null ? (
        <MerkleTree
          tree={tree}
          selectedSequence={sequence}
          tamper={tamperOverlay}
        />
      ) : (
        <p class="status-message">{LAB_COPY.merkleTreeBuildingMessage}</p>
      )}
    </section>
  );
}
