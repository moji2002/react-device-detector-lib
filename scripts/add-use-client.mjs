/**
 * esbuild drops the "use client" directive when bundling, so it is re-applied
 * to the client entry after the build. Without it, importing this package from
 * a Next.js App Router Server Component throws.
 *
 * Only index.* gets the directive — server.* must stay server-usable.
 */
import fs from 'node:fs';

const DIRECTIVE = '"use client";\n';
for (const file of ['dist/index.js', 'dist/index.cjs']) {
  if (!fs.existsSync(file)) continue;
  const body = fs.readFileSync(file, 'utf8');
  if (body.startsWith('"use client"') || body.startsWith("'use client'")) continue;
  fs.writeFileSync(file, DIRECTIVE + body);
  console.log(`added "use client" to ${file}`);
}
