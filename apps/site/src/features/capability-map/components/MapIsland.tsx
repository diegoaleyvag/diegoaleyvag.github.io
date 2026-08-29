import { useMemo, useState } from "preact/hooks";

import {
  computeMapLayout,
  decisionDomains,
  domainDecisions,
  type DecisionMapNode,
  type DomainNode,
} from "../data";
import {
  describeDecisionSelection,
  describeDomainSelection,
  mapCopyFor,
  statusLabel,
  type MapCopy,
} from "../copy";
import type { Lang } from "../../../lib/i18n";
import { LiveRegion } from "./LiveRegion";

type SelectedId = string | null;
type NodeVisualState = "neutral" | "selected" | "related" | "dimmed";
type EdgeVisualState = "neutral" | "active" | "dimmed";

export interface MapIslandProps {
  readonly lang: Lang;
  readonly domains: readonly DomainNode[];
  readonly decisions: readonly DecisionMapNode[];
}

function relatedIdsFor(
  domains: readonly DomainNode[],
  decisions: readonly DecisionMapNode[],
  selectedId: SelectedId,
): ReadonlySet<string> | null {
  if (selectedId === null) {
    return null;
  }
  const domain = domains.find((candidate) => candidate.id === selectedId);
  if (domain) {
    return new Set([
      domain.id,
      ...domainDecisions(decisions, domain.id).map((decision) => decision.id),
    ]);
  }
  const decision = decisions.find((candidate) => candidate.id === selectedId);
  if (decision) {
    return new Set([decision.id, ...decision.domainIds]);
  }
  return null;
}

/**
 * Renders the woven bipartite map and its selection panel/live region as
 * one Preact tree. Astro's Preact integration server-renders this same
 * component into real HTML at build time (see `capability-map.astro`'s
 * `client:load` usage) — the buttons, panel, and fallback list all exist
 * for a no-JS visitor already; hydration only adds click/selection
 * behavior, never new content.
 */
export function MapIsland({ lang, domains, decisions }: MapIslandProps) {
  const copy = mapCopyFor(lang);
  const [selectedId, setSelectedId] = useState<SelectedId>(null);
  const [announcement, setAnnouncement] = useState("");

  const layout = useMemo(
    () => computeMapLayout(domains, decisions),
    [domains, decisions],
  );
  const related = useMemo(
    () => relatedIdsFor(domains, decisions, selectedId),
    [domains, decisions, selectedId],
  );

  function selectNode(id: string): void {
    const nextId = selectedId === id ? null : id;
    setSelectedId(nextId);

    if (nextId === null) {
      setAnnouncement(copy.selectionClearedAnnouncement);
      return;
    }

    const domain = domains.find((candidate) => candidate.id === nextId);
    if (domain) {
      const linkedDecisions = domainDecisions(decisions, domain.id);
      setAnnouncement(
        describeDomainSelection(
          lang,
          domain.label,
          linkedDecisions.map((decision) => decision.label),
        ),
      );
      return;
    }

    const decision = decisions.find((candidate) => candidate.id === nextId);
    if (decision) {
      const linkedDomains = decisionDomains(domains, decision);
      setAnnouncement(
        describeDecisionSelection(
          lang,
          copy,
          decision.label,
          decision.status,
          linkedDomains.map((entry) => entry.label),
        ),
      );
    }
  }

  function nodeState(id: string): NodeVisualState {
    if (related === null) {
      return "neutral";
    }
    if (id === selectedId) {
      return "selected";
    }
    return related.has(id) ? "related" : "dimmed";
  }

  function edgeState(decisionId: string, domainId: string): EdgeVisualState {
    if (selectedId === null) {
      return "neutral";
    }
    return selectedId === decisionId || selectedId === domainId
      ? "active"
      : "dimmed";
  }

  return (
    <div class="capability-map__layout">
      <div class="capability-map__visual">
        <div class="capability-map__stage">
          <svg
            class="capability-map__edges"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            {layout.edges.map((edge) => (
              <path
                key={`${edge.decisionId}-${edge.domainId}`}
                class={`capability-map__edge capability-map__edge--${edge.role} is-${edgeState(edge.decisionId, edge.domainId)}`}
                d={edge.path}
              />
            ))}
          </svg>

          <div class="capability-map__nodes">
            {domains.map((domain) => {
              const point = layout.domainPoints[domain.id];
              if (!point) {
                return null;
              }
              return (
                <button
                  key={domain.id}
                  type="button"
                  class={`capability-map__node capability-map__node--domain capability-map__node--${domain.role} is-${nodeState(domain.id)}`}
                  style={{
                    "--map-x": `${point.xPct}%`,
                    "--map-y": `${point.yPct}%`,
                  }}
                  aria-pressed={selectedId === domain.id}
                  aria-describedby="capability-map-panel"
                  onClick={() => selectNode(domain.id)}
                >
                  <span class="capability-map__node-dot" aria-hidden="true" />
                  <span class="capability-map__node-label">{domain.label}</span>
                </button>
              );
            })}

            {decisions.map((decision) => {
              const point = layout.decisionPoints[decision.id];
              if (!point) {
                return null;
              }
              return (
                <button
                  key={decision.id}
                  type="button"
                  class={`capability-map__node capability-map__node--decision capability-map__node--${decision.status} is-${nodeState(decision.id)}`}
                  style={{
                    "--map-x": `${point.xPct}%`,
                    "--map-y": `${point.yPct}%`,
                  }}
                  aria-pressed={selectedId === decision.id}
                  aria-describedby="capability-map-panel"
                  onClick={() => selectNode(decision.id)}
                >
                  <span class="capability-map__node-dot" aria-hidden="true" />
                  <span class="capability-map__node-label">
                    {decision.label}
                  </span>
                  <span class="capability-map__node-status">
                    {statusLabel(copy, decision.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div class="capability-map__side">
        <MapPanel
          copy={copy}
          domains={domains}
          decisions={decisions}
          selectedId={selectedId}
          onSelectChip={selectNode}
        />
        <LiveRegion message={announcement} />
      </div>
    </div>
  );
}

interface MapPanelProps {
  readonly copy: MapCopy;
  readonly domains: readonly DomainNode[];
  readonly decisions: readonly DecisionMapNode[];
  readonly selectedId: SelectedId;
  readonly onSelectChip: (id: string) => void;
}

function MapPanel({
  copy,
  domains,
  decisions,
  selectedId,
  onSelectChip,
}: MapPanelProps) {
  if (selectedId === null) {
    return (
      <div class="capability-map__panel" id="capability-map-panel">
        <p class="capability-map__panel-kicker">{copy.panelDefaultHeading}</p>
        <p class="capability-map__panel-body">{copy.panelDefaultBody}</p>
      </div>
    );
  }

  const domain = domains.find((candidate) => candidate.id === selectedId);
  if (domain) {
    const linkedDecisions = domainDecisions(decisions, domain.id);
    return (
      <div class="capability-map__panel" id="capability-map-panel">
        <p class="capability-map__panel-kicker">{copy.domainsGroupLabel}</p>
        <h3 class="capability-map__panel-heading">{domain.label}</h3>
        <p class="capability-map__panel-body">{domain.description}</p>
        <p class="capability-map__panel-connections">
          {linkedDecisions.length === 0
            ? copy.noConnectionsYetLabel
            : copy.connectsToLabel}
          {linkedDecisions.map((decision) => (
            <button
              key={decision.id}
              type="button"
              class="capability-map__chip"
              onClick={() => onSelectChip(decision.id)}
            >
              {decision.label}
            </button>
          ))}
        </p>
      </div>
    );
  }

  const decision = decisions.find((candidate) => candidate.id === selectedId);
  if (decision) {
    const linkedDomains = decisionDomains(domains, decision);
    return (
      <div class="capability-map__panel" id="capability-map-panel">
        <p class="capability-map__panel-kicker">
          {statusLabel(copy, decision.status)}
        </p>
        <h3 class="capability-map__panel-heading">{decision.label}</h3>
        <p class="capability-map__panel-body">{decision.decision}</p>
        <p class="capability-map__panel-connections">
          {copy.connectsToLabel}
          {linkedDomains.map((entry) => (
            <button
              key={entry.id}
              type="button"
              class="capability-map__chip"
              onClick={() => onSelectChip(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </p>
      </div>
    );
  }

  return null;
}
