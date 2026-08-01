import { buildMerkleTreeView, type MerkleTreeNode } from "@portfolio/replay";
import type { RunBundle } from "@portfolio/contracts";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { LAB_COPY } from "../copy";
import { describeError } from "../format";
import type { AsyncState, TamperResultState } from "../types";
import { EventDetails } from "./EventDetails";
import { EventLedger } from "./EventLedger";
import type { TamperOverlay } from "./MerkleTree";
import { PolicySummary } from "./PolicySummary";

interface RunViewProps {
  readonly bundle: RunBundle;
}

const PLAYBACK_INTERVAL_MS = 1400;

/** One loaded, verified run: policy summary, event ledger, and event detail. */
export function RunView({ bundle }: RunViewProps) {
  const [selectedSequence, setSelectedSequence] = useState<number | null>(null);
  const [treeState, setTreeState] = useState<AsyncState<MerkleTreeNode>>({
    status: "idle",
  });
  const [tamper, setTamper] = useState<TamperResultState>({
    status: "not-run",
  });
  const [tamperOverlay, setTamperOverlay] = useState<TamperOverlay | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const ledgerHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const totalEvents = bundle.events.length;

  useEffect(() => {
    let cancelled = false;
    setTreeState({ status: "loading" });

    buildMerkleTreeView(bundle.events)
      .then((tree) => {
        if (!cancelled) {
          setTreeState({ status: "ready", value: tree });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTreeState({ status: "error", message: describeError(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bundle]);

  const stopPlayback = useCallback(() => {
    if (playTimerRef.current !== null) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => stopPlayback, [stopPlayback]);

  const startPlayback = useCallback(() => {
    stopPlayback();
    setIsPlaying(true);
    let step = 1;
    setSelectedSequence(step);
    playTimerRef.current = window.setInterval(() => {
      step += 1;
      if (step > totalEvents) {
        stopPlayback();
        return;
      }
      setSelectedSequence(step);
    }, PLAYBACK_INTERVAL_MS);
  }, [stopPlayback, totalEvents]);

  const selectManually = useCallback(
    (sequence: number) => {
      stopPlayback();
      setSelectedSequence(sequence);
    },
    [stopPlayback],
  );

  const closeDetails = useCallback(() => {
    stopPlayback();
    setSelectedSequence(null);
    // Return focus to a stable landing point once the following details
    // region closes, rather than leaving it on a removed element.
    ledgerHeadingRef.current?.focus();
  }, [stopPlayback]);

  useEffect(() => {
    setTamper({ status: "not-run" });
    setTamperOverlay(null);
  }, [selectedSequence]);

  const runTamperDemo = useCallback(
    (sequence: number, tamperedCopy: RunBundle) => {
      setTamper({ status: "checking" });
      buildMerkleTreeView(tamperedCopy.events)
        .then((tamperedTree) => {
          const matches = tamperedTree.sha256 === bundle.evidence.root_sha256;
          setTamper({
            status: matches ? "unexpectedly-passed" : "failed-as-expected",
          });
          setTamperOverlay({ tamperedTree, sequence });
        })
        .catch(() => {
          setTamper({ status: "failed-as-expected" });
        });
    },
    [bundle],
  );

  const activeTamperOverlay =
    selectedSequence !== null && tamperOverlay?.sequence === selectedSequence
      ? tamperOverlay
      : null;

  return (
    <div class="run-view">
      <PolicySummary policy={bundle.policy} />
      <div class="playback-controls">
        <button
          type="button"
          onClick={isPlaying ? stopPlayback : startPlayback}
        >
          {isPlaying ? LAB_COPY.pauseRunLabel : LAB_COPY.playRunLabel}
        </button>
        <p class="playback-status" role="status" aria-live="polite">
          {isPlaying && selectedSequence !== null
            ? `${LAB_COPY.playingStatusLabel} \u00b7 ${LAB_COPY.playbackStepLabel} ${selectedSequence} ${LAB_COPY.playbackOfLabel} ${totalEvents}`
            : ""}
        </p>
      </div>
      <EventLedger
        bundle={bundle}
        selectedSequence={selectedSequence}
        onSelect={selectManually}
        headingRef={ledgerHeadingRef}
      />
      {selectedSequence !== null ? (
        <EventDetails
          bundle={bundle}
          sequence={selectedSequence}
          onClose={closeDetails}
          shouldFocusOnMount={!isPlaying}
          tree={treeState.status === "ready" ? treeState.value : null}
          tamper={tamper}
          tamperOverlay={activeTamperOverlay}
          onTamper={runTamperDemo}
        />
      ) : null}
    </div>
  );
}
