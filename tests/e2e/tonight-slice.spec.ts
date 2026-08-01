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

for (const route of ["/", "/resume/", "/lab/replay/", "/404.html"]) {
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

for (const route of ["/", "/resume/", "/lab/replay/"]) {
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

test("loads the self-hosted Archivo fonts only from the local static origin", async ({
  page,
  networkGuard,
}) => {
  await page.goto("/");
  await expect
    .poll(() => networkGuard.localPaths)
    .toEqual(
      expect.arrayContaining([
        "/fonts/archivo-variable.woff2",
        "/fonts/archivo-black.woff2",
      ]),
    );
});

test("exercises both finite replay variants and in-memory tampering", async ({
  page,
  networkGuard,
}) => {
  await page.goto("/lab/replay/");

  const readAllowed = page.getByRole("button", { name: /read-allowed/i });
  await readAllowed.focus();
  await page.keyboard.press("Enter");

  const policy = page.locator(".policy-summary");
  await expect(
    policy.getByRole("heading", { name: "Policy decision" }),
  ).toBeVisible();
  await expect(policy.getByText("Allow", { exact: true })).toBeVisible();
  await expect(page.locator(".event-row")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: /Tool completed/i }),
  ).toBeVisible();

  const rawPolicy = policy.getByText("Raw policy record JSON", { exact: true });
  await rawPolicy.focus();
  await page.keyboard.press("Enter");
  await expect(policy.locator("pre.raw-json")).toContainText(
    '"action": "fixture:read"',
  );

  const firstEvent = page.getByRole("button", { name: /Run started/i });
  await firstEvent.focus();
  await page.keyboard.press("Enter");

  const details = page.locator("#event-details-panel");
  await expect(details).toBeFocused();
  await expect(details.getByText(/^Integrity check passed:/)).toBeVisible();
  await expect(
    details.getByText(
      /Because the bundle and root are served by the same origin/,
    ),
  ).toBeVisible();

  // The visual Merkle tree highlights event 1's inclusion path: the leaf and
  // its three ancestors up to the root, plus the three sibling hashes a real
  // proof recombines with; the other four leaves stay unmarked.
  const tree = details.locator(".merkle-tree");
  await expect(tree).toBeVisible();
  await expect(tree.locator(".merkle-tree__node--path")).toHaveCount(4);
  await expect(tree.locator(".merkle-tree__node--sibling")).toHaveCount(3);
  await expect(tree.locator(".merkle-tree__node--tamper")).toHaveCount(0);

  const tamper = details.getByRole("button", {
    name: "Tamper with an in-memory copy",
  });
  await tamper.focus();
  await page.keyboard.press("Enter");
  await expect(
    details.getByText(
      /Tamper check result: the modified copy no longer matches/,
    ),
  ).toBeVisible();

  // Tampering recomputes the same four-node path with different hashes: the
  // diagram marks exactly those nodes (and the root) broken.
  await expect(tree.locator(".merkle-tree__node--tamper")).toHaveCount(4);
  await expect(tree.locator(".merkle-tree__root-compare")).toContainText(
    "Root mismatch",
  );

  const closeDetails = details.getByRole("button", { name: "Close detail" });
  await closeDetails.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveCount(0);

  const adjustDenied = page.getByRole("button", { name: /adjust-denied/i });
  await adjustDenied.focus();
  await page.keyboard.press("Space");

  await expect(policy.getByText("Deny", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tool started/i })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /Tool completed/i }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/policy denied the action before any tool executed/i),
  ).toBeVisible();

  expect(networkGuard.localPaths).toEqual(
    expect.arrayContaining([
      "/replays/v1/manifest.json",
      "/replays/v1/synthetic-maintenance-v1/read-allowed.json",
      "/replays/v1/synthetic-maintenance-v1/adjust-denied.json",
    ]),
  );
});

test("plays a run back automatically and can be paused", async ({ page }) => {
  await page.goto("/lab/replay/");
  await page.getByRole("button", { name: /read-allowed/i }).click();

  const playButton = page.getByRole("button", { name: "Play run" });
  await playButton.click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.locator(".playback-status")).toContainText("Step 1 of 6");

  // Autoplay does not steal focus from the page on each step.
  await expect(page.locator("#event-details-panel")).not.toBeFocused();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play run" })).toBeVisible();
  const pausedStep = await page
    .locator("#event-details-panel h3")
    .textContent();

  await page.waitForTimeout(1600);
  await expect(page.locator("#event-details-panel h3")).toHaveText(
    pausedStep ?? "",
  );

  await playButton.click();
  await expect(page.getByRole("button", { name: "Play run" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator("#event-details-panel h3")).toContainText("06");
});

test("keeps portfolio and resume meaningful without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const networkGuard = await guardNetwork(page);

  for (const route of ["/", "/resume/"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  expect([...new Set(networkGuard.unexpectedRequests)]).toEqual([]);
  await context.close();
});
