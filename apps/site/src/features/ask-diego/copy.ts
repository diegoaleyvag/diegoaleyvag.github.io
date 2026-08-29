import type { AskLocale } from "./api.ts";

/**
 * UI-only interface copy for the Ask Diego surface — never a factual claim
 * about Diego himself (those come from the corpus/résumé/manifests). The
 * Spanish column is a genuinely edited rendering, not a mechanical mirror
 * (`.cursor/rules/content.mdc`).
 */
export interface AskGuideCopy {
  readonly documentTitle: string;
  readonly heading: string;
  readonly intro: string;
  readonly faqHeading: string;
  readonly formHeading: string;
  readonly formIntro: string;
  readonly questionLabel: string;
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly loadingLabel: string;
  readonly sourceLabel: string;
  readonly closestMatchNote: string;
  readonly rateLimitedMessage: string;
  readonly errorMessage: string;
  readonly validationTooShort: string;
  readonly validationTooLong: string;
  readonly historyHint: string;
  readonly noScriptMessage: string;
  readonly resetLabel: string;
  readonly askedLabel: string;
}

export const ASK_GUIDE_COPY: Record<AskLocale, AskGuideCopy> = {
  en: {
    documentTitle: "Ask Diego",
    heading: "Ask Diego",
    intro:
      "A closed question box, grounded only in what's published on this site — Diego's bio, Five Decisions, credentials, education, and this FAQ. It never guesses, and every answer names its source.",
    faqHeading: "Frequently asked",
    formHeading: "Ask something else",
    formIntro:
      "Type a question below. If nothing here answers it, you'll get an honest \"I don't know\" and a way to reach Diego directly — never a guess.",
    questionLabel: "Your question",
    placeholder: "e.g. What is Prism?",
    submitLabel: "Ask",
    loadingLabel: "Thinking…",
    sourceLabel: "Source",
    closestMatchNote: "Closest match on file — not a fully confident answer.",
    rateLimitedMessage:
      "You've asked a lot of questions in a short time. Please wait a moment before trying again.",
    errorMessage:
      "Something went wrong answering that. Please try again, or use the FAQ above or the contact links to reach Diego directly.",
    validationTooShort:
      "Ask a slightly longer question (at least 4 characters).",
    validationTooLong: "Keep the question under 400 characters.",
    historyHint:
      "Ask Diego only remembers your last couple of messages, and only for this visit.",
    noScriptMessage:
      "This box needs JavaScript to work. With JavaScript off, use the FAQ above or the contact links below.",
    resetLabel: "Start over",
    askedLabel: "You asked",
  },
  es: {
    documentTitle: "Pregúntale a Diego",
    heading: "Pregúntale a Diego",
    intro:
      "Un cuadro de preguntas cerrado, basado solo en lo que ya está publicado en este sitio: la biografía de Diego, Five Decisions, sus credenciales, su formación y estas preguntas frecuentes. Nunca inventa una respuesta, y cada una indica su fuente.",
    faqHeading: "Preguntas frecuentes",
    formHeading: "Pregunta otra cosa",
    formIntro:
      'Escribe tu pregunta abajo. Si nada de esto la responde, obtendrás un honesto "no lo sé" y una forma de contactar a Diego directamente — nunca una suposición.',
    questionLabel: "Tu pregunta",
    placeholder: "p. ej. ¿Qué es Prism?",
    submitLabel: "Preguntar",
    loadingLabel: "Pensando…",
    sourceLabel: "Fuente",
    closestMatchNote:
      "La coincidencia más cercana disponible, sin ser una respuesta totalmente segura.",
    rateLimitedMessage:
      "Has hecho muchas preguntas en poco tiempo. Espera un momento antes de volver a intentarlo.",
    errorMessage:
      "Algo salió mal al responder eso. Intenta de nuevo, o usa las preguntas frecuentes de arriba o los enlaces de contacto para escribirle a Diego directamente.",
    validationTooShort:
      "Escribe una pregunta un poco más larga (al menos 4 caracteres).",
    validationTooLong: "Mantén la pregunta por debajo de 400 caracteres.",
    historyHint:
      "Ask Diego solo recuerda tus últimos mensajes, y únicamente durante esta visita.",
    noScriptMessage:
      "Este cuadro necesita JavaScript para funcionar. Sin JavaScript, usa las preguntas frecuentes de arriba o los enlaces de contacto de abajo.",
    resetLabel: "Empezar de nuevo",
    askedLabel: "Preguntaste",
  },
};
