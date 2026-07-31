import type { RunBundle } from "@portfolio/contracts";

import {
  DECISION_LABELS,
  DECISION_MARKS,
  LAB_COPY,
  VARIANT_SUMMARY,
} from "../copy";
import type { AsyncState, VariantId } from "../types";
import { VARIANT_IDS } from "../types";
import { Mark } from "./Mark";

interface VariantPickerProps {
  readonly selected: VariantId | null;
  readonly bundleStates: Partial<Record<VariantId, AsyncState<RunBundle>>>;
  readonly onSelect: (variant: VariantId) => void;
}

export function VariantPicker({
  selected,
  bundleStates,
  onSelect,
}: VariantPickerProps) {
  return (
    <fieldset class="variant-picker-fieldset">
      <legend>{LAB_COPY.variantPickerLegend}</legend>
      <ul class="variant-picker">
        {VARIANT_IDS.map((variant) => {
          const info = VARIANT_SUMMARY[variant];
          const state = bundleStates[variant];
          const decision =
            state?.status === "ready"
              ? state.value.policy.decision.effect
              : null;

          return (
            <li key={variant}>
              <button
                type="button"
                class="variant-picker__button"
                aria-pressed={selected === variant}
                onClick={() => onSelect(variant)}
              >
                <span class="variant-picker__id mono">{info.label}</span>
                <p class="variant-picker__summary">{info.summary}</p>
                {decision !== null ? (
                  <Mark
                    tone={decision}
                    glyph={DECISION_MARKS[decision]}
                    label={DECISION_LABELS[decision]}
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
