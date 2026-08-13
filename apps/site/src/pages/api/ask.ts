import type { APIRoute } from "astro";

// This is the site's one intentionally dynamic route (see AGENTS.md and ADR
// 0014). It exists here only to prove the static-plus-one-function adapter
// pipeline end to end; a later workstream replaces this body with the real
// Ask Diego corpus lookup, citations, and provider-optional fallback.
export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ status: "not_implemented" }), {
    status: 501,
    headers: {
      "content-type": "application/json",
    },
  });
};
