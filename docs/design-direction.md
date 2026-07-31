# Design direction: Editorial Evidence Ledger

Status: **Chosen and binding**

There is one direction, not a theme menu. The site should feel like a carefully
edited technical record: quiet enough for a résumé, structured enough for a
governed-run inspector, and visibly authored rather than assembled from a
generic component library.

## Design argument

The portfolio and lab share a visual grammar of source, sequence, and
qualification:

- portfolio facts have source-path provenance;
- run events have sequence numbers and evidence;
- decisions have explicit state and reason;
- integrity results include their trust limit.

The design makes those relationships easy to scan. It does not pretend the
résumé is a cryptographic object and does not turn Diego into a dashboard.

## Foundation tokens

The initial system uses CSS custom properties in one `tokens.css`. Tokens exist
for consistency and accessibility, not to support alternate visual themes.

```css
:root {
  --paper: #f4f0e7;
  --paper-raised: #faf8f2;
  --ink: #181714;
  --ink-muted: #625e56;
  --rule: #c9c1b6;
  --signal: #7d302a;
  --signal-soft: #f0ded8;

  --font-body:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  --font-display: ui-serif, Georgia, Cambria, "Times New Roman", serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;

  --measure: 68ch;
  --radius: 2px;
  --rule-width: 1px;
}
```

Exact contrast must be verified in tests before implementation is accepted.
State is never encoded by color alone. Print mode becomes white paper, black
type, and visible rules.

No web font is required tonight. Layout and hierarchy must carry the identity.
A later self-hosted font change requires a measured performance and licensing
review, keeps system fallbacks, and may not add a third-party request.

**Amendment (owner-approved, post-slice polish):** the display role now leads
with the self-hosted **Fraunces** variable serif (SIL OFL 1.1), applied only to
`--font-display` headings. It satisfies this paragraph's conditions: a single
latin weight-axis WOFF2 subset (~36 KB, preloaded), the system-serif fallback
stack is preserved, and it adds no third-party request (served from
`/fonts/`). Body text remains on the system humanist sans.

## Typography

- Body and interface text use the system humanist sans stack.
- Page openings and a small number of section titles use the serif stack.
- Monospace is reserved for hashes, event IDs, policy paths, source paths, and
  raw JSON. It is not the default “technical” voice.
- Use a restrained fluid type scale, normal sentence case, and compact labels.
- Body measure stays near `68ch`; résumé text remains readable at 200% and 400%
  zoom.
- Tabular numerals are used only where alignment conveys real sequence or time.
- CV numbers remain inside their exact source strings, never oversized as
  marketing metrics.

## Layout

### Wide screens

Use a twelve-column grid:

- main reading column: approximately seven columns;
- evidence rail: approximately three columns;
- remaining columns provide breathing room, not empty card gutters.

The rail may contain source labels, dates, status qualifications, and navigation
that directly relates to the adjacent content. It may not contain decorative
badges or filler.

### Narrow screens

Collapse to one column. Evidence-rail content moves directly beneath the item it
qualifies. Source, decision, and trust-limit copy must remain in reading order;
it cannot disappear behind hover.

### Surface treatment

Use the paper background, one raised paper tone, thin rules, and alignment.
Avoid shadows. Corners are square or nearly square. Sections are ledger rows,
not a grid of floating cards.

## Page composition

### Home

- Small identity header, exact source headline, exact summary, and plain contact
  paths.
- A source-grounded evidence sequence separated by numbered rules.
- One clear invitation to the synthetic lab.
- No oversized hero, portrait collage, rotating titles, or decorative stats.

### Résumé

- Conventional document outline with strong section headings and compact,
  readable entries.
- Source ordering and exact strings remain primary.
- Print styles remove navigation while preserving links, dates, and hierarchy.
- Provenance may be exposed as unobtrusive source references, never as a
  “verified” seal.

### Replay

- A vertical event ledger is the primary interaction.
- Each row shows sequence, event label, decision state where relevant, and a
  concise summary.
- Selecting a row opens an adjacent or following details region containing
  policy input/output, raw values, and evidence.
- Allow, deny, and integrity-failure states use distinct text labels and simple
  geometric marks in addition to color.
- Raw JSON is behind a native disclosure and rendered as text, not HTML.
- The same-origin evidence limitation sits beside the integrity result, not in
  a distant legal page.

## Interaction and motion

- Replay never auto-plays.
- Native buttons, links, lists, and disclosures come before custom controls.
- Visible focus uses a high-contrast two-pixel outline with offset.
- Hover may reinforce an existing affordance but cannot reveal required
  information.
- Motion is limited to short state transitions and the movement of focus or
  disclosure content. There are no scroll-triggered entrance sequences.
- Under `prefers-reduced-motion: reduce`, transitions are removed.
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
  green-on-black “hacker” styling;
- dashboard card grids for ordinary prose;
- excessive pills, badges, rounded rectangles, and nested panels;
- unearned “verified,” “secure,” “trusted,” “production,” or “compliant”
  stamps;
- decorative counters, invented telemetry, fake latency, or fake uptime;
- autoplay, parallax, cursor effects, and scroll-jacking;
- stock component-library defaults left visually unchanged;
- icons where a direct text label is clearer;
- hidden content that exists only to fill an empty layout;
- more than one primary accent color outside functional status needs.

Every visual element must answer at least one question: Does it communicate
provenance, sequence, state, qualification, hierarchy, or navigation? If not,
remove it.

## Accessibility and performance rules

- Target WCAG 2.2 AA.
- Use one logical heading hierarchy, landmarks, a skip link, visible focus, and
  keyboard-complete Replay controls.
- Do not rely on color, position, animation, or a diagram alone.
- The home and résumé routes ship no client framework JavaScript.
- Replay's initial static HTML remains meaningful before hydration.
- Lazy-load secondary bundles, policy source, and raw JSON.
- No third-party scripts, font CDNs, client analytics, or decorative video.
- Set explicit dimensions for any future image and prevent font-related layout
  shift.

## Tonight's design scope

Tonight implements:

- foundation tokens and reset;
- global shell, skip link, navigation, and footer;
- home and résumé typography and responsive layout;
- evidence rail behavior at wide and narrow widths;
- Replay event ledger, selected details, allow/deny states, and integrity
  result/qualification;
- print résumé rules;
- focus, contrast, reduced-motion, keyboard, and zoom checks.

Tonight does not include alternate themes, custom font production, elaborate
illustration, animated topology, dark mode, page-transition choreography, or
design-system documentation beyond the tokens and primitives actually used.
