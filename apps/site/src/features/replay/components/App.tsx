import type { ReplayManifest, RunBundle } from "@portfolio/contracts";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { DECISION_LABELS, LAB_COPY, VARIANT_SUMMARY } from "../copy";
import { fetchBundle, fetchManifest, findVariantEntry } from "../data";
import { describeError } from "../format";
import type { AsyncState, VariantId } from "../types";
import { LiveRegion } from "./LiveRegion";
import { RunView } from "./RunView";
import { VariantPicker } from "./VariantPicker";

export function App() {
  const [manifestState, setManifestState] = useState<
    AsyncState<ReplayManifest>
  >({ status: "idle" });
  const [selectedVariant, setSelectedVariant] = useState<VariantId | null>(
    null,
  );
  const [bundleStates, setBundleStates] = useState<
    Partial<Record<VariantId, AsyncState<RunBundle>>>
  >({});
  const [statusMessage, setStatusMessage] = useState("");
  const requestedVariants = useRef<Set<VariantId>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setManifestState({ status: "loading" });

    fetchManifest()
      .then((manifest) => {
        if (!cancelled) {
          setManifestState({ status: "ready", value: manifest });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setManifestState({ status: "error", message: describeError(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadVariant = useCallback(
    (variant: VariantId, manifest: ReplayManifest) => {
      if (requestedVariants.current.has(variant)) {
        return;
      }
      requestedVariants.current.add(variant);
      setBundleStates((previous) => ({
        ...previous,
        [variant]: { status: "loading" },
      }));

      let entry: ReturnType<typeof findVariantEntry>;
      try {
        entry = findVariantEntry(manifest, variant);
      } catch (error) {
        setBundleStates((previous) => ({
          ...previous,
          [variant]: { status: "error", message: describeError(error) },
        }));
        return;
      }

      fetchBundle(entry)
        .then((bundle) => {
          setBundleStates((previous) => ({
            ...previous,
            [variant]: { status: "ready", value: bundle },
          }));
          setStatusMessage(
            `Loaded the ${VARIANT_SUMMARY[variant].label} run: ` +
              `${bundle.events.length} events, policy ` +
              `${DECISION_LABELS[bundle.policy.decision.effect].toLowerCase()}.`,
          );
        })
        .catch((error: unknown) => {
          const message = describeError(error);
          setBundleStates((previous) => ({
            ...previous,
            [variant]: { status: "error", message },
          }));
          setStatusMessage(
            `The ${VARIANT_SUMMARY[variant].label} run failed to load: ${message}`,
          );
        });
    },
    [],
  );

  useEffect(() => {
    if (selectedVariant !== null && manifestState.status === "ready") {
      loadVariant(selectedVariant, manifestState.value);
    }
  }, [selectedVariant, manifestState, loadVariant]);

  const selectVariant = useCallback((variant: VariantId) => {
    setSelectedVariant(variant);
    setStatusMessage(`Selected the ${VARIANT_SUMMARY[variant].label} run.`);
  }, []);

  const activeBundleState: AsyncState<RunBundle> =
    selectedVariant === null
      ? { status: "idle" }
      : (bundleStates[selectedVariant] ?? { status: "idle" });

  return (
    <div class="replay-app">
      <LiveRegion message={statusMessage} />

      <VariantPicker
        selected={selectedVariant}
        bundleStates={bundleStates}
        onSelect={selectVariant}
      />

      {manifestState.status === "loading" ? (
        <p class="status-message">{LAB_COPY.manifestLoadingMessage}</p>
      ) : null}
      {manifestState.status === "error" ? (
        <p class="status-message" data-tone="error">
          {LAB_COPY.manifestErrorMessage}
        </p>
      ) : null}

      {selectedVariant !== null && activeBundleState.status !== "idle" ? (
        <div class="run-view-container">
          {activeBundleState.status === "loading" ? (
            <p class="status-message">{LAB_COPY.bundleLoadingMessage}</p>
          ) : null}
          {activeBundleState.status === "error" ? (
            <p class="status-message" data-tone="error">
              {LAB_COPY.bundleErrorMessagePrefix} {activeBundleState.message}
            </p>
          ) : null}
          {activeBundleState.status === "ready" ? (
            <RunView key={selectedVariant} bundle={activeBundleState.value} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
