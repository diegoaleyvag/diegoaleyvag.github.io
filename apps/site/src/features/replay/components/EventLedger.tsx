import type { RunBundle } from "@portfolio/contracts";
import type { Ref } from "preact";

import {
  DECISION_LABELS,
  DECISION_MARKS,
  EVENT_TYPE_LABELS,
  LAB_COPY,
} from "../copy";
import { Mark } from "./Mark";

interface EventLedgerProps {
  readonly bundle: RunBundle;
  readonly selectedSequence: number | null;
  readonly onSelect: (sequence: number) => void;
  readonly headingRef: Ref<HTMLHeadingElement>;
}

export function EventLedger({
  bundle,
  selectedSequence,
  onSelect,
  headingRef,
}: EventLedgerProps) {
  const hasToolExecution = bundle.events.some(
    (event) => event.type === "tool_started" || event.type === "tool_completed",
  );

  return (
    <section aria-labelledby="event-ledger-heading">
      <h3 id="event-ledger-heading" ref={headingRef} tabIndex={-1}>
        {LAB_COPY.eventLedgerHeading}
      </h3>
      <ol class="event-ledger">
        {bundle.events.map((event) => (
          <li class="event-row" key={event.event_id}>
            <button
              type="button"
              class="event-row__button"
              aria-expanded={selectedSequence === event.sequence}
              aria-controls="event-details-panel"
              onClick={() => onSelect(event.sequence)}
            >
              <span class="event-row__sequence mono">
                {String(event.sequence).padStart(2, "0")}
              </span>
              <span class="event-row__label">
                <strong>{EVENT_TYPE_LABELS[event.type]}</strong>
                <span class="event-row__summary">{event.summary}</span>
              </span>
              <span class="event-row__decision">
                {event.type === "policy_evaluated" ? (
                  <Mark
                    tone={event.data.effect}
                    glyph={DECISION_MARKS[event.data.effect]}
                    label={DECISION_LABELS[event.data.effect]}
                  />
                ) : null}
                {event.type === "run_completed" ? (
                  <Mark
                    tone="allow"
                    glyph={DECISION_MARKS.allow}
                    label={LAB_COPY.outcomeAllowedLabel}
                  />
                ) : null}
                {event.type === "run_denied" ? (
                  <Mark
                    tone="deny"
                    glyph={DECISION_MARKS.deny}
                    label={LAB_COPY.outcomeDeniedLabel}
                  />
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {!hasToolExecution ? (
        <p class="ledger-note">{LAB_COPY.noToolExecutionNote}</p>
      ) : null}
    </section>
  );
}
