import type { RunBundle } from "@portfolio/contracts";
import { useCallback, useRef, useState } from "preact/hooks";

import { EventDetails } from "./EventDetails";
import { EventLedger } from "./EventLedger";
import { PolicySummary } from "./PolicySummary";

interface RunViewProps {
  readonly bundle: RunBundle;
}

/** One loaded, verified run: policy summary, event ledger, and event detail. */
export function RunView({ bundle }: RunViewProps) {
  const [selectedSequence, setSelectedSequence] = useState<number | null>(null);
  const ledgerHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const closeDetails = useCallback(() => {
    setSelectedSequence(null);
    // Return focus to a stable landing point once the following details
    // region closes, rather than leaving it on a removed element.
    ledgerHeadingRef.current?.focus();
  }, []);

  return (
    <div class="run-view">
      <PolicySummary policy={bundle.policy} />
      <EventLedger
        bundle={bundle}
        selectedSequence={selectedSequence}
        onSelect={setSelectedSequence}
        headingRef={ledgerHeadingRef}
      />
      {selectedSequence !== null ? (
        <EventDetails
          bundle={bundle}
          sequence={selectedSequence}
          onClose={closeDetails}
        />
      ) : null}
    </div>
  );
}
