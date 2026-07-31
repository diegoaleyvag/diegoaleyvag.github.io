import { render } from "preact";

import { App } from "./components/App";
import "./replay.css";

/**
 * Manually mounts the Replay island into a static placeholder element.
 * There is no Astro/Preact SSR integration in this slice, so the page's own
 * static markup (clean-room declaration, scenario summary, evidence-limit
 * copy) — not this component — is what stays meaningful before hydration.
 */
export function mountReplayExplorer(root: Element): void {
  render(<App />, root);
}
