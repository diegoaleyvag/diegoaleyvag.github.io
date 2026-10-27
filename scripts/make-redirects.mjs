import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = {
  '/cv': '/cv',
  '/resume': '/cv',
  '/es/cv': '/cv',
  '/es': '/',
  '/work': '/#work',
  '/archive': '/#work',
  '/ask': '/#contact',
  '/passport': '/#about',
  '/work/governance-lab': '/#work',
  '/work/axiom': '/#work',
  '/work/limen': '/#work',
  '/work/prism': '/#work',
  '/work/relay': '/#work',
  '/work/vector': '/#work',
};

// One template for both GitHub Pages URL forms; query strings are intentionally dropped.
function render(destination) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Moved to diegoleyva.dev</title>
    <meta http-equiv="refresh" content="0; url=${destination}" />
    <link rel="canonical" href="${destination}" />
    <meta name="robots" content="noindex" />
    <script>
      location.replace(${JSON.stringify(destination)} + location.hash);
    </script>
  </head>
  <body>
    <p>This page moved to <a href="${destination}">${destination}</a>.</p>
  </body>
</html>
`;
}

for (const [route, target] of Object.entries(routes)) {
  const html = render(`https://diegoleyva.dev${target}`);
  const directory = path.join(root, route.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
  if (!route.endsWith('/')) await writeFile(`${directory}.html`, html);
}
await writeFile(path.join(root, '.nojekyll'), '');
console.log(`Generated ${Object.keys(routes).length * 2} redirect pages.`);
