// Post-build: add `.js` extensions to relative imports in the emitted dist so the published
// package works in strict Node ESM (bundlers tolerate extensionless; Node does not). Source stays
// extensionless so Next.js `transpilePackages` keeps resolving @confidium/core from src in dev.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const relImport = /(from\s+["'])(\.\/[A-Za-z0-9_-]+)(["'])/g;

const files = (await readdir(distDir)).filter((f) => f.endsWith(".js") || f.endsWith(".d.ts"));
let touched = 0;
for (const file of files) {
  const path = join(distDir, file);
  const src = await readFile(path, "utf8");
  const out = src.replace(relImport, "$1$2.js$3");
  if (out !== src) {
    await writeFile(path, out);
    touched += 1;
  }
}
console.log(`add-dist-extensions: rewrote ${touched} file(s)`);
