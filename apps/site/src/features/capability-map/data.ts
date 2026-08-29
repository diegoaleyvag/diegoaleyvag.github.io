import type { DecisionStatus } from "@portfolio/decisions";

import type { MapContent } from "../../lib/site-content";

export type DomainRole = "survey" | "signal" | "neutral";

/**
 * Fixed pentagon order — matches `content/site/map.yaml`'s `domains` array
 * in both languages (enforced by `tests/integration/site-content.test.ts`).
 * Role assignment follows DESIGN.md's four named color roles: Data/Systems
 * are "Survey", Applied AI/Product are "Signal", and Learning deliberately
 * carries no hue role at all — that omission is itself the palette
 * encoding the learning/build-journey distinction, never a missing color.
 */
export const DOMAIN_ORDER = [
  "data",
  "applied-ai",
  "systems",
  "product",
  "learning",
] as const;

export type DomainId = (typeof DOMAIN_ORDER)[number];

const DOMAIN_ROLE_BY_ID: Readonly<Record<DomainId, DomainRole>> = {
  data: "survey",
  "applied-ai": "signal",
  systems: "survey",
  product: "signal",
  learning: "neutral",
};

/**
 * Which domains each decision connects to on the map — derived only from
 * what `content/site/map.yaml`'s own per-domain `connection` text already
 * states, never a guessed pairing (see that file's header comment and
 * `content/site/README.md`):
 *
 * - "data" and "learning" each state a connection to literally every one of
 *   the Five Decisions ("Every one of the Five Decisions starts here...",
 *   "Feeds every decision below...") — so every decision id gets both.
 * - "applied-ai" names only Prism specifically ("Prism ... lives here most
 *   directly") — so only Prism gets it.
 * - "systems" describes a decision that has already "stopped being an idea
 *   and becomes something that runs on its own." Prism is the only decision
 *   whose manifest records `status: "building"` / a set `buildStarted`
 *   date; the other four are still `status: "planned"` with no
 *   `buildStarted` date, i.e. still ideas by the manifest's own honest
 *   status field — so only Prism gets "systems" today.
 * - "product" describes passing a bar ("usable and checkable by someone
 *   else") no decision's manifest status has reached yet (none is
 *   `verified`/`released`) — so it connects to no decision yet. A domain
 *   node with zero current connections is itself an honest statement, not
 *   a placeholder pairing.
 *
 * This map is intentionally not auto-derived from decision status at
 * runtime (a "planned" decision could ship any month); it is a fixed,
 * reviewed reading of the fixed prose above, extended only by editing that
 * prose and this comment together.
 */
const DECISION_DOMAIN_IDS: Readonly<Record<string, readonly DomainId[]>> = {
  prism: ["data", "applied-ai", "systems", "learning"],
  axiom: ["data", "learning"],
  relay: ["data", "learning"],
  limen: ["data", "learning"],
  vector: ["data", "learning"],
};

export interface DomainNode {
  readonly id: DomainId;
  readonly label: string;
  readonly role: DomainRole;
  readonly description: string;
  readonly connection: string;
}

export interface DecisionMapNode {
  readonly id: string;
  readonly label: string;
  readonly status: DecisionStatus;
  readonly decision: string;
  readonly domainIds: readonly DomainId[];
}

export function buildDomainNodes(
  mapContent: MapContent,
): readonly DomainNode[] {
  return DOMAIN_ORDER.map((id) => {
    const entry = mapContent.domains.find((domain) => domain.id === id);
    if (entry === undefined) {
      throw new Error(`content/site/map.yaml is missing domain "${id}"`);
    }
    return {
      id,
      label: entry.label,
      role: DOMAIN_ROLE_BY_ID[id],
      description: entry.description,
      connection: entry.connection,
    };
  });
}

export interface DecisionSourceEntry {
  readonly id: string;
  readonly title: string;
  readonly status: DecisionStatus;
  readonly decision: string;
}

export function buildDecisionNodes(
  entries: readonly DecisionSourceEntry[],
): readonly DecisionMapNode[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.title,
    status: entry.status,
    decision: entry.decision,
    domainIds: DECISION_DOMAIN_IDS[entry.id] ?? [],
  }));
}

export function domainDecisions(
  decisions: readonly DecisionMapNode[],
  domainId: string,
): readonly DecisionMapNode[] {
  return decisions.filter((decision) =>
    decision.domainIds.includes(domainId as DomainId),
  );
}

export function decisionDomains(
  domains: readonly DomainNode[],
  decision: DecisionMapNode,
): readonly DomainNode[] {
  return decision.domainIds
    .map((domainId) => domains.find((domain) => domain.id === domainId))
    .filter((domain): domain is DomainNode => domain !== undefined);
}

export interface LayoutPoint {
  readonly xPct: number;
  readonly yPct: number;
}

export interface EdgeGeometry {
  readonly decisionId: string;
  readonly domainId: string;
  readonly role: DomainRole;
  readonly path: string;
}

export interface MapLayout {
  readonly domainPoints: Readonly<Record<string, LayoutPoint>>;
  readonly decisionPoints: Readonly<Record<string, LayoutPoint>>;
  readonly edges: readonly EdgeGeometry[];
}

const CENTER = 50;
const DOMAIN_RADIUS = 41;
const DECISION_RADIUS = 18;
const START_ANGLE_DEG = -90;
const BOW = 0.16;
// Members of a same-signature group (identical domain connections — see
// `DECISION_DOMAIN_IDS` above) are spread by *radius*, not angle, at their
// shared mean angle. Radius spacing keeps a fixed on-screen gap between
// dots regardless of how wide the arc at that radius is, which angle-based
// spacing does not: two dots close to the center are much closer together
// than the same angular gap far from the center. This is what keeps every
// node's clickable target comfortably past WCAG 2.2's 24px minimum
// spacing at every viewport width the map is tested at.
const GROUP_RADIUS_STEP = 9;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function pointOnCircle(angleDeg: number, radius: number): LayoutPoint {
  const rad = degToRad(angleDeg);
  return {
    xPct: CENTER + radius * Math.cos(rad),
    yPct: CENTER + radius * Math.sin(rad),
  };
}

function circularMeanAngleDeg(anglesDeg: readonly number[]): number {
  const x = anglesDeg.reduce(
    (sum, angle) => sum + Math.cos(degToRad(angle)),
    0,
  );
  const y = anglesDeg.reduce(
    (sum, angle) => sum + Math.sin(degToRad(angle)),
    0,
  );
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function curvedPath(from: LayoutPoint, to: LayoutPoint): string {
  const midX = (from.xPct + to.xPct) / 2;
  const midY = (from.yPct + to.yPct) / 2;
  const dx = to.xPct - from.xPct;
  const dy = to.yPct - from.yPct;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const controlX = midX + normalX * length * BOW;
  const controlY = midY + normalY * length * BOW;
  return `M ${from.xPct.toFixed(2)} ${from.yPct.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${to.xPct.toFixed(2)} ${to.yPct.toFixed(2)}`;
}

/**
 * Places domains on a fixed pentagon and each decision at the circular mean
 * angle of the domains it connects to. Several decisions here share an
 * identical domain set (axiom/relay/limen/vector all connect to exactly
 * data+learning today — see `DECISION_DOMAIN_IDS` above), which would
 * otherwise collapse them onto the same point; same-signature decisions are
 * instead fanned along that one shared angle at increasing radius, in id
 * order, purely for legibility — it changes no connection, only how far out
 * along its real, shared direction a dot sits.
 */
export function computeMapLayout(
  domains: readonly DomainNode[],
  decisions: readonly DecisionMapNode[],
): MapLayout {
  const domainAngles: Record<string, number> = {};
  const domainPoints: Record<string, LayoutPoint> = {};

  domains.forEach((domain, index) => {
    const angle = START_ANGLE_DEG + (360 / domains.length) * index;
    domainAngles[domain.id] = angle;
    domainPoints[domain.id] = pointOnCircle(angle, DOMAIN_RADIUS);
  });

  const groups = new Map<string, DecisionMapNode[]>();
  for (const decision of decisions) {
    const signature = [...decision.domainIds].sort().join("|");
    const group = groups.get(signature);
    if (group) {
      group.push(decision);
    } else {
      groups.set(signature, [decision]);
    }
  }

  const decisionPoints: Record<string, LayoutPoint> = {};
  const edges: EdgeGeometry[] = [];

  for (const group of groups.values()) {
    const [first] = group;
    if (first === undefined || first.domainIds.length === 0) {
      continue;
    }
    const angles = first.domainIds.map((id) => domainAngles[id] ?? 0);
    const meanAngle = circularMeanAngleDeg(angles);
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));

    sorted.forEach((decision, index) => {
      const radiusOffset =
        sorted.length === 1
          ? 0
          : (index - (sorted.length - 1) / 2) * GROUP_RADIUS_STEP;
      const point = pointOnCircle(meanAngle, DECISION_RADIUS + radiusOffset);
      decisionPoints[decision.id] = point;

      for (const domainId of decision.domainIds) {
        const domainPoint = domainPoints[domainId];
        const domain = domains.find((entry) => entry.id === domainId);
        if (domainPoint === undefined || domain === undefined) {
          continue;
        }
        edges.push({
          decisionId: decision.id,
          domainId,
          role: domain.role,
          path: curvedPath(point, domainPoint),
        });
      }
    });
  }

  return { domainPoints, decisionPoints, edges };
}
