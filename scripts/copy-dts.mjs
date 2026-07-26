/** Emit .d.cts alongside .d.ts so the `require` condition resolves types too. */
import fs from 'node:fs';

for (const name of ['index', 'server']) {
  const src = `dist/${name}.d.ts`;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, `dist/${name}.d.cts`);
    console.log(`wrote dist/${name}.d.cts`);
  }
}
