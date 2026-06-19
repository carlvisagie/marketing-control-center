/**
 * Bundle the Node server — same proven pattern as Just Talk and Coaching.
 * Runs esbuild from repo root so all imports resolve correctly.
 * The createRequire banner fixes ESM dynamic require errors (pg, etc.)
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

await esbuild.build({
  absWorkingDir: appRoot,
  tsconfig: path.join(appRoot, "tsconfig.json"),
  entryPoints: [path.join(appRoot, "server/_core/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(appRoot, "dist/index.js"),
  packages: "external",
  banner: {
    js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);`,
  },
  logLevel: "info",
});
