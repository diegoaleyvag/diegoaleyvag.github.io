import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page, type Route } from "@playwright/test";

const staticOrigin = "http://127.0.0.1:4173";

interface NetworkGuard {
  readonly localPaths: string[];
  readonly unexpectedRequests: string[];
}

async function guardNetwork(page: Page): Promise<NetworkGuard> {
  const localPaths: string[] = [];
  const unexpectedRequests: string[] = [];

  await page.route("**/*", async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (url.origin !== staticOrigin) {
        unexpectedRequests.push(url.href);
        await route.abort("blockedbyclient");
        return;
      }
      localPaths.push(url.pathname);
    }
    await route.continue();
  });

  return { localPaths, unexpectedRequests };
}

const test = base.extend<{ networkGuard: NetworkGuard }>({
  networkGuard: async ({ page }, use) => {
    const guard = await guardNetwork(page);
    await use(guard);
    expect([...new Set(guard.unexpectedRequests)]).toEqual([]);
  },
});

const routes = [
  "/",
  "/es/",
  "/work/",
  "/es/trabajo/",
  "/work/prism/",
  "/es/trabajo/prism/",
  "/work/axiom/",
  "/es/trabajo/axiom/",
  "/work/governance-lab/",
  "/archive/",
  "/es/archivo/",
  "/resume/",
  "/es/cv/",
  "/ask/",
  "/es/pregunta/",
  "/404.html",
];

for (const route of routes) {
  test(`directly loads physical route ${route}`, async ({
    page,
    networkGuard,
  }) => {
    void networkGuard;
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("collects zero console errors across every route", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`${message.text()} (console error)`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`${error.message} (page error)`);
  });

  for (const route of routes) {
    await page.goto(route);
  }

  expect(errors).toEqual([]);
});

for (const route of [
  "/",
  "/es/",
  "/work/",
  "/work/prism/",
  "/resume/",
  "/ask/",
  "/es/pregunta/",
]) {
  test(`has no serious or critical accessibility violations on ${route}`, async ({
    page,
    networkGuard,
  }) => {
    void networkGuard;
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const severeViolations = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );

    expect(
      severeViolations,
      JSON.stringify(
        severeViolations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          targets: nodes.map(({ target }) => target),
        })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}

test("loads only self-hosted fonts, from the local static origin", async ({
  page,
  networkGuard,
}) => {
  await page.goto("/");
  await expect
    .poll(() => networkGuard.localPaths)
    .toEqual(
      expect.arrayContaining([
        "/fonts/big-shoulders-display-variable.woff2",
        "/fonts/public-sans-variable.woff2",
      ]),
    );
});

test("gives English and Spanish homes the same section structure", async ({
  page,
}) => {
  for (const route of ["/", "/es/"]) {
    await page.goto(route);
    await expect(page.locator("#hero-name")).toBeVisible();
    await expect(page.locator("#capability-map-heading")).toBeVisible();
    await expect(page.locator("#decisions-heading")).toBeVisible();
    await expect(page.locator("#selected-work-heading")).toBeVisible();
    await expect(page.locator("#education-heading")).toBeVisible();
    await expect(page.locator("#about-heading")).toBeVisible();
    await expect(page.locator("#contact-heading")).toBeVisible();
  }
});

test("the capability map is keyboard-operable and announces a selection", async ({
  page,
}) => {
  await page.goto("/");

  const prismButton = page.getByRole("button", { name: /Prism/ });
  await prismButton.focus();
  await page.keyboard.press("Enter");

  await expect(prismButton).toHaveAttribute("aria-pressed", "true");
  const panel = page.locator("#capability-map-panel");
  await expect(panel.getByRole("heading", { name: "Prism" })).toBeVisible();
  await expect(page.locator(".capability-map__live-region")).toContainText(
    "Selected Prism",
  );

  // Selecting a connected domain chip moves the selection without a pointer.
  const chip = panel.getByRole("button").first();
  await chip.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".capability-map__live-region")).not.toContainText(
    "Selected Prism",
  );
});

test("the map's full no-JS-equivalent connection list is always in the DOM", async ({
  page,
}) => {
  await page.goto("/");
  const fallback = page.locator(".capability-map__fallback");
  await expect(fallback).toBeAttached();
  await expect(fallback.locator("dt")).toHaveCount(10);
});

test("removes map selection motion under prefers-reduced-motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const prismButton = page.getByRole("button", { name: /Prism/ });
  await prismButton.focus();
  await page.keyboard.press("Enter");

  const dot = prismButton.locator(".capability-map__node-dot");
  const transform = await dot.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);

  const outlineWidth = await dot.evaluate(
    (element) => getComputedStyle(element).outlineWidth,
  );
  expect(outlineWidth).not.toBe("0px");
});

test("keeps essential homepage and résumé content meaningful without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const networkGuard = await guardNetwork(page);

  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore my work" }),
  ).toBeVisible();
  // The map's complete no-JS list fallback stays in the DOM.
  await expect(page.locator(".capability-map__fallback dt")).toHaveCount(10);
  await expect(page.locator("#decisions-heading")).toBeVisible();
  await expect(page.locator(".contact-links a").first()).toBeVisible();

  await page.goto("/resume/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Download the PDF/ }),
  ).toBeVisible();

  expect([...new Set(networkGuard.unexpectedRequests)]).toEqual([]);
  await context.close();
});

test("every English route has a working Spanish counterpart via the language switcher", async ({
  page,
}) => {
  for (const [enRoute, esRoute] of [
    ["/", "/es/"],
    ["/work/", "/es/trabajo/"],
    ["/work/prism/", "/es/trabajo/prism/"],
    ["/resume/", "/es/cv/"],
    ["/archive/", "/es/archivo/"],
  ] as const) {
    await page.goto(enRoute);
    await page.getByRole("link", { name: "ES", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`${esRoute.replace(/\//g, "\\/")}$`),
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
});
