import type { DecisionEffect, IntegrityStatus } from "../types";

export type MarkTone = DecisionEffect | IntegrityStatus;

interface MarkProps {
  readonly tone: MarkTone;
  readonly glyph: string;
  readonly label: string;
}

/**
 * Renders a state as both a short geometric glyph and a full text label, per
 * docs/design-direction.md: "Allow, deny, and integrity-failure states use
 * distinct text labels and simple geometric marks in addition to color."
 * The glyph is decorative (aria-hidden); the label is the accessible name.
 */
export function Mark({ tone, glyph, label }: MarkProps) {
  return (
    <span class={`mark mark--${tone}`}>
      <span class="mark__glyph" aria-hidden="true">
        {glyph}
      </span>
      <span class="mark__label">{label}</span>
    </span>
  );
}
