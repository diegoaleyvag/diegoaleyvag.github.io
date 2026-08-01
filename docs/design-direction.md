# Design direction: Brutalist Editorial

Status: **Chosen and binding** ([ADR 0013](adr/0013-brutalist-editorial.md)
supersedes the earlier [Editorial Evidence Ledger](adr/0012-editorial-evidence-ledger.md)
direction recorded here previously.)

There is one direction, not a theme menu. The site should feel like a
confident, self-authored editorial document: bold enough to be memorable on a
portfolio, structured enough for a résumé, and precise enough for a
governed-run inspector. Boldness comes from type scale, one loud accent
color, and ledger structure — never from generic component-library effects.

## Design argument

The portfolio and lab share a visual grammar of source, sequence, and
qualification:

- portfolio facts have source-path provenance;
- run events have sequence numbers and evidence;
- decisions have explicit state and reason;
- integrity results include their trust limit.

The design makes those relationships easy to scan and impossible to miss. It
does not pretend the résumé is a cryptographic object, and it does not invent
metrics — but it is allowed, deliberately, to be loud about its own identity:
an oversized masthead, uppercase section openers, and thick rules are the
hero, not a violation of restraint.

## Foundation tokens

The system uses CSS custom properties in one `tokens.css`. Tokens exist for
consistency and accessibility, not to support alternate visual themes.

```css
:root {
  --paper: #f2efe6;
  --paper-raised: #fbf9f3;
  --ink: #16150f;
  --ink-muted: #6b675b;
  --rule: var(--ink);
  --rule-soft: #cdc7b8;
  /* Bright fill for backgrounds/rules (AA-safe as a 3:1 non-text UI color
     against --paper; pair with --ink or --paper text on top of it). */
  --signal: #e8442a;
  /* Deepened variant for signal used as TEXT directly on --paper/--paper-raised
     (links, decision marks): verified >= 4.5:1 against both. */
  --signal-text: #c1391f;
  --signal-ink: #ffffff;
  --signal-soft: #fbe3dc;

  --font-body:
    "Archivo", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --font-display:
    "Archivo Black", "Archivo", ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;

  --measure: 66ch;
  --radius: 0;
  --rule-width: 2px;
  --rule-hair: 1px;
}
```

Exact contrast is verified in tests before implementation is accepted (the
brighter `--signal` is reserved for backgrounds, fills, and other non-text UI
where the 3:1 floor applies; `--signal-text` is the only signal value used
for text on paper). State is never encoded by color alone. Print mode becomes
white paper, black type, and visible rules.

**Self-hosted display type.** Archivo Black (masthead, top-level section
openers) and variable Archivo (everything else, including every heading
below the masthead) are self-hosted WOFF2 files under `apps/site/public/fonts/`
(SIL OFL 1.1), declared with `@font-face`, and preloaded from `BaseLayout`.
No font CDN or other third-party request ships in production; the system
sans stack remains the fallback while a face loads.

## Typography

- Archivo Black carries the home masthead and top-level section openers only;
  Archivo (variable) carries body copy, UI labels, and every other heading.
- Section and sub-section headings are set uppercase; body copy and list
  content are not.
- Monospace is reserved for hashes, event IDs, policy paths, source paths,
  and raw JSON. It is not the default "technical" voice.
- Body measure stays near `66ch`; résumé text remains readable at 200% and
  400% zoom.
- Tabular numerals are used for ledger index numbers and anywhere alignment
  conveys real sequence or time.
- CV numbers remain inside their exact source strings, never oversized as
  marketing metrics. The masthead's own scale is a typographic device, not a
  fabricated statistic.

## Layout

### Ledger rows, not cards

Every route composes the same primitive: a numbered ledger row (index,
heading, evidence rail, body), separated by thick rules. The home page's
evidence sequence, the résumé's experience/projects/education, and the lab's
static sections (`01`/`02`/`03`) all use this pattern so the three routes read
as one authored document family.

### Wide screens

Ledger rows use a three-part split: a fixed index column, a reading column,
and an evidence rail. The rail may contain source labels, dates, status
qualifications, and navigation that directly relates to the adjacent content.
It may not contain decorative badges or filler.

### Narrow screens

Collapse to one column. Evidence-rail content moves directly beneath the item
it qualifies. Source, decision, and trust-limit copy must remain in reading
order; it cannot disappear behind hover.

### Surface treatment

Use the paper background, one raised paper tone, thick rules, and alignment.
Avoid shadows and gradients. Corners are square. Sections are ledger rows,
not a grid of floating cards.

## Page composition

### Home

- An oversized masthead: exact source name (with a decorative accent-colored
  period), exact source headline as a vertical side tag, and exact summary
  and contact paths in the surrounding meta rows.
- A source-grounded evidence sequence separated by numbered ledger rows.
- One clear invitation to the synthetic lab.
- No portrait collage, rotating titles, or decorative stats — the identity
  comes from type and structure, not imagery or invented numbers.

### Résumé

- Built on the same shell and ledger-row primitives as the home page, not a
  standalone document template, so it reads like one strong designed
  document rather than a plain data dump.
- Source ordering and exact strings remain primary.
- Print styles remove navigation while preserving links, dates, and
  hierarchy.
- Provenance may be exposed as unobtrusive source references, never as a
  "verified" seal.

### Replay

- A vertical event ledger is the primary interaction; selecting a row opens
  a following details region with policy input/output, raw values, and
  evidence.
- Allow, deny, and integrity-failure states use distinct text labels and
  simple geometric marks in addition to color.
- Raw JSON is behind a native disclosure and rendered as text, not HTML.
- The same-origin evidence limitation sits beside the integrity result, not
  in a distant legal page.
- The Merkle evidence is additionally rendered as a labelled figure: the
  reconstructed tree, the selected event's inclusion path and sibling
  hashes, and — after the in-memory tamper action — the broken path and
  root mismatch in place. The figure is decorative (`aria-hidden`); every
  fact it shows is already available as accessible text beside it.
- An explicit, user-initiated "Play run" control may step a loaded run
  through its events automatically; see "Interaction and motion" for its
  constraints.

## Interaction and motion

- Nothing auto-plays on page load. Replay's ledger and evidence stay static
  until a person selects a row. A "Play run" control is the one exception:
  it must be started by an explicit click, expose an always-visible pause
  control, never move focus on its own (only a manual selection moves
  focus), and stop cleanly at the end of the run.
- Native buttons, links, lists, and disclosures come before custom controls.
- Visible focus uses a high-contrast two-pixel outline with offset.
- Hover may reinforce an existing affordance but cannot reveal required
  information.
- Motion is limited to short state transitions, the movement of focus or
  disclosure content, and the tamper demonstration's brief highlight. There
  are no scroll-triggered entrance sequences.
- Under `prefers-reduced-motion: reduce`, transitions and the tamper
  highlight animation are removed; state still changes, just without the
  animated transition.
- Integrity updates use a restrained live region and do not repeatedly
  interrupt screen readers.

## Anti-slop rules

The following are prohibited:

- purple or blue-purple gradients;
- ambient gradients of any color;
- glassmorphism, blur panels, glow, bloom, or neon;
- floating blobs, particle fields, grid tunnels, star fields, and generative
  backgrounds;
- robot, brain, spark, magic-wand, shield-with-circuit, or generic AI imagery;
- generated portraits or decorative AI illustrations;
- fake terminals, typing animations, command prompts used as decoration, and
  green-on-black "hacker" styling;
- dashboard card grids for ordinary prose;
- excessive pills, badges, rounded rectangles, and nested panels;
- unearned "verified," "secure," "trusted," "production," or "compliant"
  stamps;
- decorative counters, invented telemetry, fake latency, or fake uptime;
- unsolicited autoplay, parallax, cursor effects, and scroll-jacking;
- stock component-library defaults left visually unchanged;
- icons where a direct text label is clearer;
- hidden content that exists only to fill an empty layout;
- more than one primary accent color outside functional status needs.

Every visual element must answer at least one question: Does it communicate
provenance, sequence, state, qualification, hierarchy, or navigation — or, on
the home masthead, is it the deliberate identity moment itself? If not,
remove it.

## Accessibility and performance rules

- Target WCAG 2.2 AA.
- Use one logical heading hierarchy, landmarks, a skip link, visible focus,
  and keyboard-complete Replay controls (including "Play run"/pause).
- Do not rely on color, position, animation, or a diagram alone: the Merkle
  tree figure is decorative, and every state it shows also exists as
  accessible text.
- The home and résumé routes ship no client framework JavaScript.
- Replay's initial static HTML remains meaningful before hydration.
- Lazy-load secondary bundles, policy source, and raw JSON.
- No third-party scripts, font CDNs, client analytics, or decorative video —
  self-hosted display fonts are preloaded from the same origin.
- Set explicit dimensions for any future image and prevent font-related
  layout shift.

## Design scope

Implemented:

- foundation tokens and reset, self-hosted Archivo/Archivo Black, and a
  refreshed print stylesheet;
- global shell, skip link, navigation, and footer;
- home masthead, résumé, lab shell, and 404 typography and responsive
  layout, sharing one ledger-row primitive;
- evidence rail behavior at wide and narrow widths;
- Replay event ledger, selected details, allow/deny states, integrity
  result/qualification, a visual Merkle tree with inclusion-path and tamper
  highlighting, and an opt-in "Play run" step-through;
- print résumé rules;
- focus, contrast, reduced-motion, keyboard, and zoom checks.

Not included: alternate themes, dark mode, elaborate illustration, a second
synthetic scenario, page-transition choreography, or design-system
documentation beyond the tokens and primitives actually used.
