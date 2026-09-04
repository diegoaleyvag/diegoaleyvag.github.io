import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page, type Route } from "@playwright/test";

const staticOrigin = "http://127.0.0.1:4173";

function githubUrl(path: string): string {
  return ["https:", "", "github.com", path].join("/");
}

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

for (const { route, methodologyUrl, evidenceUrl } of [
  {
    route: "/work/axiom/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/axiom/blob/477b8660a0e7546257fe509bfe5795a65d99fed4/HANDOFF.md#five-decisions-methodology",
    ),
    evidenceUrl: "packages/core/src/domain/portfolio-manifest.test.ts",
  },
  {
    route: "/es/trabajo/axiom/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/axiom/blob/477b8660a0e7546257fe509bfe5795a65d99fed4/HANDOFF.md#five-decisions-methodology",
    ),
    evidenceUrl: "packages/core/src/domain/portfolio-manifest.test.ts",
  },
  {
    route: "/work/relay/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/relay/blob/main/docs/failure-semantics.md",
    ),
    evidenceUrl: "internal/engine/integration_test.go",
  },
  {
    route: "/es/trabajo/relay/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/relay/blob/main/docs/failure-semantics.md",
    ),
    evidenceUrl: "internal/engine/integration_test.go",
  },
] as const) {
  for (const width of [320, 375, 768, 1440]) {
    test(`${route} keeps evidence and methodology links reflow-safe at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      for (const href of [evidenceUrl, methodologyUrl]) {
        const link = page.locator(`a[href="${href}"]`);
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", href);
        await link.focus();
        await expect(link).toBeFocused();
      }

      const widths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(widths.scrollWidth).toBe(widths.clientWidth);
    });
  }
}

for (const route of ["/resume/", "/es/cv/"]) {
  for (const width of [320, 375, 768, 1440]) {
    test(`${route} keeps all résumé content reflow-safe at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      const download = page.getByRole("link", { name: /PDF|PDF del CV/ });
      await expect(download).toBeVisible();
      await expect(download).toHaveAttribute(
        "href",
        "/downloads/cv/diego-leyva-cv.pdf",
      );
      await download.focus();
      await expect(download).toBeFocused();
      const skills = page.locator(".resume-skills dd");
      expect(await skills.count()).toBeGreaterThan(0);
      expect(
        await skills.evaluateAll((nodes) =>
          nodes.every((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }),
        ),
      ).toBe(true);

      const overflow = await page
        .locator(".resume-page *")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth)
            .map((node) => ({
              selector: `${node.tagName.toLowerCase()}.${node.className}`,
              scrollWidth: node.scrollWidth,
              clientWidth: node.clientWidth,
            })),
        );
      expect(overflow).toEqual([]);

      const widths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(widths.scrollWidth).toBe(widths.clientWidth);
    });
  }
}

for (const { route, notPublishedLabel } of [
  { route: "/work/", notPublishedLabel: "Not published" },
  { route: "/es/trabajo/", notPublishedLabel: "No publicado" },
] as const) {
  test(`${route} does not show the Personal Governance Lab on the home page but keeps it here`, async ({
    page,
  }) => {
    await page.goto(route);
    const card = page.locator('a.case-card[href$="governance-lab/"]');
    await expect(card).toBeVisible();
    await expect(
      card.getByText(notPublishedLabel, { exact: true }),
    ).toBeVisible();
  });
}

for (const route of ["/", "/es/"]) {
  test(`${route} no longer promotes the Personal Governance Lab card on the home page`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(
      page.locator('a.case-card[href$="governance-lab/"]'),
    ).toHaveCount(0);
    await expect(page.getByText("Personal Governance Lab")).toHaveCount(0);
  });
}

for (const { route, methodologyUrl } of [
  {
    route: "/work/prism/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/prism/blob/faac6b68bc2305ba8849b4cf15dc1a0dab423fce/docs/METHODOLOGY.md",
    ),
  },
  {
    route: "/es/trabajo/prism/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/prism/blob/faac6b68bc2305ba8849b4cf15dc1a0dab423fce/docs/METHODOLOGY.md",
    ),
  },
  {
    route: "/work/limen/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/limen/blob/5dc60e4b5a95b3f51fa1d08529d403b0a31da5c1/docs/STRATEGIES.md",
    ),
  },
  {
    route: "/es/trabajo/limen/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/limen/blob/5dc60e4b5a95b3f51fa1d08529d403b0a31da5c1/docs/STRATEGIES.md",
    ),
  },
  {
    route: "/work/vector/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/vector/blob/384dd00294ffec38f215b989bb9335404793a0d8/docs/decision-method.md",
    ),
  },
  {
    route: "/es/trabajo/vector/",
    methodologyUrl: githubUrl(
      "diegoaleyvag/vector/blob/384dd00294ffec38f215b989bb9335404793a0d8/docs/decision-method.md",
    ),
  },
] as const) {
  for (const width of [320, 375, 768, 1440]) {
    test(`${route} keeps its methodology link exact, visible, and reflow-safe at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      const link = page.locator(`a[href="${methodologyUrl}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", methodologyUrl);
      await link.focus();
      await expect(link).toBeFocused();

      const widths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(widths.scrollWidth).toBe(widths.clientWidth);
    });
  }
}

for (const route of ["/", "/es/"]) {
  for (const width of [320, 375, 768, 1440]) {
    test(`${route} keeps the about portrait square, contained, and layout-shift-safe at ${width}px`, async ({
      page,
    }) => {
      // Installed before any script runs so it captures every layout-shift
      // entry the page produces, including ones from lazy image decode.
      await page.addInitScript(() => {
        (window as unknown as { __clsValue: number }).__clsValue = 0;
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              };
              if (!shift.hadRecentInput) {
                (window as unknown as { __clsValue: number }).__clsValue +=
                  shift.value;
              }
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });
        } catch {
          // layout-shift isn't observable in every environment; the CLS
          // assertion below tolerates that by only checking an upper bound.
        }
      });

      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      const image = page.locator(".about-portrait img");
      // The image is lazy-loaded and sits well below the fold; scroll it
      // into view first so the browser actually decodes it before we
      // assert on its natural size.
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await page.waitForFunction(
        () =>
          (document.querySelector(".about-portrait img") as HTMLImageElement)
            ?.complete === true,
      );

      // Intrinsic sizing attributes stay on the element (no layout shift
      // from a missing width/height pair).
      await expect(image).toHaveAttribute("width", "480");
      await expect(image).toHaveAttribute("height", "480");

      const naturalSize = await image.evaluate((element) => {
        const img = element as HTMLImageElement;
        return { complete: img.complete, naturalWidth: img.naturalWidth };
      });
      expect(naturalSize.complete).toBe(true);
      expect(naturalSize.naturalWidth).toBeGreaterThan(0);

      const box = await image.boundingBox();
      expect(box).not.toBeNull();
      // Squareness within 1px tolerates subpixel rounding the browser
      // itself introduces; it isn't a claim of exactness we can't verify.
      expect(
        Math.abs((box?.width ?? 0) - (box?.height ?? 0)),
      ).toBeLessThanOrEqual(1);
      // The image never exceeds the min(100%, 14rem) contract.
      expect(box?.width ?? 0).toBeGreaterThan(0);
      expect(box?.width ?? 0).toBeLessThanOrEqual(224 + 1);

      const computed = await image.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          aspectRatio: style.aspectRatio,
          objectFit: style.objectFit,
        };
      });
      expect(["1 / 1", "1"]).toContain(computed.aspectRatio);
      expect(computed.objectFit).toBe("cover");

      // Scroll past the portrait and back to force any lazy-load reflow,
      // then read the conservative, browser-reported cumulative shift.
      await page.mouse.wheel(0, 1200);
      await page.mouse.wheel(0, -1200);
      await page.waitForTimeout(200);

      const cls = await page.evaluate(
        () => (window as unknown as { __clsValue: number }).__clsValue,
      );
      // A conservative upper bound: the portrait's own reserved box should
      // not itself register a meaningful shift once width/height + aspect
      // ratio are set. This isn't a claim of zero shift network-wide.
      expect(cls).toBeLessThan(0.1);
    });
  }
}

for (const route of ["/", "/es/"]) {
  for (const width of [320, 375, 768, 1440]) {
    test(`${route} keeps all home content reflow-safe at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      const contactLinks = page.locator(".home .contact-links a");
      expect(await contactLinks.count()).toBeGreaterThan(0);
      for (let index = 0; index < (await contactLinks.count()); index += 1) {
        const link = contactLinks.nth(index);
        await expect(link).toBeVisible();
        await link.focus();
        await expect(link).toBeFocused();
      }

      const email = page.locator('.home .contact-links a[href^="mailto:"]');
      await expect(email).toHaveCount(1);
      expect(await email.getAttribute("href")).toBe(
        `mailto:${(await email.textContent())?.trim()}`,
      );

      const overflow = await page
        .locator(".home *")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth)
            .map((node) => node.tagName),
        );
      expect(overflow).toEqual([]);

      const mapButton = page.getByRole("button", { name: /Prism/ });
      await mapButton.focus();
      await page.keyboard.press("Enter");
      await expect(mapButton).toHaveAttribute("aria-pressed", "true");
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth ===
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  }
}
