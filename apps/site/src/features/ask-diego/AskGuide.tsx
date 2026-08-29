import { useId, useRef, useState } from "preact/hooks";

import {
  callAskApi,
  type AskCitation,
  type AskHistoryTurn,
  type AskLocale,
} from "./api.ts";
import { ASK_GUIDE_COPY } from "./copy.ts";
import { getOrCreateClientSessionId } from "./session.ts";

import "./ask-guide.css";

export interface AskGuideProps {
  readonly locale: AskLocale;
}

type ViewState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | {
      readonly kind: "answered";
      readonly question: string;
      readonly answer: string;
      readonly citations: readonly AskCitation[];
      readonly note?: string;
    }
  | { readonly kind: "rate_limited"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

const MIN_QUESTION_LENGTH = 4;
const MAX_QUESTION_LENGTH = 400;
const MAX_STORED_TURNS = 4;

/**
 * The one progressively-enhanced piece of Ask Diego: the server-rendered
 * static FAQ (in `AskPage.astro`) works with no JavaScript at all; this
 * component only adds the interactive follow-up box on top of it. Every
 * network outcome — answered, fallback, rate-limited, or a hard error —
 * gets its own visible state; nothing fails silently
 * (`.cursor/rules/frontend.mdc`).
 */
export default function AskGuide({ locale }: AskGuideProps) {
  const copy = ASK_GUIDE_COPY[locale];
  const [question, setQuestion] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly AskHistoryTurn[]>([]);
  const [state, setState] = useState<ViewState>({ kind: "idle" });
  const resultRegionRef = useRef<HTMLDivElement | null>(null);
  const inputId = useId();
  const errorId = useId();

  function appendTurns(nextTurns: readonly AskHistoryTurn[]): void {
    setHistory((previous) =>
      [...previous, ...nextTurns].slice(-MAX_STORED_TURNS),
    );
  }

  function focusResultRegion(): void {
    requestAnimationFrame(() => {
      resultRegionRef.current?.focus();
    });
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();

    if (trimmed.length < MIN_QUESTION_LENGTH) {
      setValidationError(copy.validationTooShort);
      return;
    }
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setValidationError(copy.validationTooLong);
      return;
    }
    setValidationError(null);
    setState({ kind: "loading" });

    const result = await callAskApi({
      question: trimmed,
      locale,
      history,
      sessionId: getOrCreateClientSessionId(),
    });
    const { body } = result;

    if (body.status === "answered") {
      setState({
        kind: "answered",
        question: trimmed,
        answer: body.answer,
        citations: body.citations,
      });
      appendTurns([
        { role: "user", content: trimmed },
        { role: "assistant", content: body.answer },
      ]);
    } else if (body.status === "fallback") {
      setState({
        kind: "answered",
        question: trimmed,
        answer: body.answer,
        citations: body.citations,
        ...(body.reason === "no_match" ? {} : { note: copy.closestMatchNote }),
      });
      appendTurns([
        { role: "user", content: trimmed },
        { role: "assistant", content: body.answer },
      ]);
    } else if (body.status === "rate_limited") {
      setState({ kind: "rate_limited", message: copy.rateLimitedMessage });
    } else {
      setState({ kind: "error", message: copy.errorMessage });
    }

    setQuestion("");
    focusResultRegion();
  }

  function handleReset(): void {
    setState({ kind: "idle" });
    setHistory([]);
    setValidationError(null);
  }

  const isLoading = state.kind === "loading";

  return (
    <div class="ask-guide">
      <form
        class="ask-guide__form"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <label class="ask-guide__label" htmlFor={inputId}>
          {copy.questionLabel}
        </label>
        <div class="ask-guide__row">
          <input
            id={inputId}
            class="ask-guide__input"
            type="text"
            name="question"
            value={question}
            onInput={(event) =>
              setQuestion((event.target as HTMLInputElement).value)
            }
            placeholder={copy.placeholder}
            minLength={MIN_QUESTION_LENGTH}
            maxLength={MAX_QUESTION_LENGTH}
            required
            aria-describedby={validationError !== null ? errorId : undefined}
            aria-invalid={validationError !== null ? "true" : undefined}
            disabled={isLoading}
          />
          <button class="ask-guide__submit" type="submit" disabled={isLoading}>
            {isLoading ? copy.loadingLabel : copy.submitLabel}
          </button>
        </div>
        {validationError !== null && (
          <p id={errorId} class="ask-guide__validation" role="alert">
            {validationError}
          </p>
        )}
        <p class="ask-guide__hint">{copy.historyHint}</p>
      </form>

      <div
        class="ask-guide__result"
        aria-live="polite"
        tabIndex={-1}
        ref={resultRegionRef}
      >
        {state.kind === "loading" && (
          <p class="ask-guide__loading">{copy.loadingLabel}</p>
        )}

        {state.kind === "answered" && (
          <div class="ask-guide__answer">
            <p class="ask-guide__asked">
              <strong>{copy.askedLabel}:</strong> {state.question}
            </p>
            {state.note !== undefined && (
              <p class="ask-guide__note">{state.note}</p>
            )}
            <p class="ask-guide__answer-text">{state.answer}</p>
            {state.citations.length > 0 && (
              <p class="ask-guide__citations">
                {copy.sourceLabel}:{" "}
                {state.citations.map((citation, index) => (
                  <span key={citation.id}>
                    {index > 0 ? ", " : ""}
                    <span class="ask-guide__citation">{citation.label}</span>
                  </span>
                ))}
              </p>
            )}
            <button
              type="button"
              class="ask-guide__reset"
              onClick={handleReset}
            >
              {copy.resetLabel}
            </button>
          </div>
        )}

        {state.kind === "rate_limited" && (
          <p class="ask-guide__error">{state.message}</p>
        )}
        {state.kind === "error" && (
          <p class="ask-guide__error">{state.message}</p>
        )}
      </div>
    </div>
  );
}
