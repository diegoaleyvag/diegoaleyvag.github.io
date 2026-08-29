// Throwaway evidence-capture script for verify-and-handoff. Not shipped.
// Starts the same static server the e2e suite uses (serving
// apps/site/.vercel/output/static/, the real deployable artifact), then:
//   1. screenshots every required route at 1440px and 375px
//   2. records console errors/pageerrors per route
//   3. does a manual keyboard-tab pass on /, /work/prism/, /ask/
//   4. checks for horizontal overflow at 200%/400% CSS zoom on / and /resume/
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const REPO_ROOT = "/Users/atomicz/dev/diegoaleyvag";
const STATIC_ORIGIN = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = `${REPO_ROOT}/evidence/screenshots`;

const ROUTES = [
  { path: "/", name: "home-en" },
  { path: "/es/", name: "home-es" },
  { path: "/work/", name: "work-en" },
  { path: "/work/prism/", name: "work-prism-en" },
  { path: "/resume/", name: "resume-en" },
  { path: "/ask/", name: "ask-en" },
  { path: "/es/pregunta/", name: "ask-es" },
];

const WIDTHS = [1440, 375];

mkdirSync(SCREENSHOT_DIR, { recursive: true });

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 404) {
          resolve();
          return;
        }
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) {
        reject(new Error("static server did not become ready in time"));
        return;
      }
      setTimeout(attempt, 200);
    };
    attempt();
  });
}

async function main() {
  const server = spawn(
    "node",
    ["--import", "tsx", "tests/e2e/static-server.ts"],
    { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`[server:err] ${d}`));

  try {
    await waitForServer(`${STATIC_ORIGIN}/`, 15000);

    const browser = await chromium.launch();

    // 1 + 2: screenshots + console error capture at both widths.
    const consoleReport = {};
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: width === 1440 ? 900 : 812 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
      });
      page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

      for (const route of ROUTES) {
        errors.length = 0;
        const resp = await page.goto(`${STATIC_ORIGIN}${route.path}`, {
          waitUntil: "networkidle",
        });
        await page.waitForTimeout(150);
        const fileName = `${route.name}-${width}.png`;
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${fileName}`,
          fullPage: true,
        });
        consoleReport[`${route.path} @ ${width}px`] = {
          status: resp?.status(),
          errors: [...errors],
        };
      }
      await context.close();
    }

    console.log("\n=== Console error report ===");
    for (const [key, value] of Object.entries(consoleReport)) {
      console.log(
        `${key}: status=${value.status} errors=${JSON.stringify(value.errors)}`,
      );
    }

    // 3: keyboard operability + visible focus on /, /work/prism/, /ask/.
    console.log("\n=== Keyboard operability pass ===");
    const kbContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const kbPage = await kbContext.newPage();
    for (const route of ["/", "/work/prism/", "/ask/"]) {
      await kbPage.goto(`${STATIC_ORIGIN}${route}`, {
        waitUntil: "networkidle",
      });
      console.log(`\nRoute ${route}:`);
      const steps = 10;
      for (let i = 0; i < steps; i += 1) {
        await kbPage.keyboard.press("Tab");
        const info = await kbPage.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.textContent || "").trim().slice(0, 40),
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
            visible: rect.width > 0 && rect.height > 0,
          };
        });
        console.log(`  tab ${i + 1}: ${JSON.stringify(info)}`);
      }
    }
    await kbContext.close();

    // 4: 200%/400% zoom overflow check on / and /resume/.
    //
    // Real browser page-zoom (Ctrl/Cmd +) shrinks the *effective CSS-pixel*
    // viewport width available for layout (window.innerWidth drops) while
    // keeping the physical window the same size — it does not merely scale a
    // fixed-width render the way the non-standard CSS `zoom` property does.
    // The standard automated equivalent for WCAG 1.4.10 reflow testing is
    // therefore to resize the viewport to width ÷ zoom-factor and check for
    // horizontal overflow at that narrower effective width, which is what
    // this does. (A CSS-`zoom`-property version of this check was also tried
    // first and produced different, less trustworthy numbers — noted in the
    // handoff as the dishonest-looking approach that was discarded.)
    console.log(
      "\n=== Zoom overflow check (viewport-resize reflow equivalent) ===",
    );
    const baseWidth = 1440;
    const zoomContext = await browser.newContext({
      viewport: { width: baseWidth, height: 900 },
    });
    const zoomPage = await zoomContext.newPage();
    for (const route of ["/", "/resume/"]) {
      for (const zoomPct of [200, 400]) {
        const effectiveWidth = Math.round(baseWidth / (zoomPct / 100));
        await zoomPage.setViewportSize({
          width: effectiveWidth,
          height: 900,
        });
        await zoomPage.goto(`${STATIC_ORIGIN}${route}`, {
          waitUntil: "networkidle",
        });
        await zoomPage.waitForTimeout(100);
        const overflow = await zoomPage.evaluate(() => {
          const doc = document.documentElement;
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
          };
        });
        console.log(
          `${route} @ ${zoomPct}% (effective viewport ${effectiveWidth}px): ${JSON.stringify(overflow)}`,
        );
        const safeRoute = route.replace(/\//g, "_") || "root";
        await zoomPage.screenshot({
          path: `${SCREENSHOT_DIR}/../zoom-check${safeRoute}-${zoomPct}pct.png`,
          fullPage: true,
        });
      }
    }
    await zoomContext.close();

    await browser.close();
  } finally {
    server.kill("SIGTERM");
    await sleep(300);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
