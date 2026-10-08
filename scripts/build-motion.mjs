import { build } from "esbuild";
import { copyFile, readFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("assets/vendor/", root);
const packageInfo = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
await mkdir(output, { recursive: true });
await build({
  entryPoints: [new URL("scripts/motion-entry.js", root).pathname],
  outfile: new URL("motion.js", output).pathname,
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "WhyeungMotion",
  target: ["es2020"],
  legalComments: "inline",
  banner: { js: `/*! Motion ${packageInfo.dependencies.motion} | MIT | motion.dev | motion.LICENSE.txt */` },
});
await copyFile(new URL("node_modules/motion/LICENSE.md", root), new URL("motion.LICENSE.txt", output));
