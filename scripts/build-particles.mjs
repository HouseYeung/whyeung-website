import { build } from "esbuild";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import particleData from "./particle-data.cjs";

const root = new URL("../", import.meta.url);
const packageInfo = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
await build({
  entryPoints: [new URL("scripts/particles-entry.js", root).pathname],
  outfile: new URL("assets/particles.js", root).pathname,
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  legalComments: "inline",
  banner: { js: `/*! Three.js ${packageInfo.dependencies.three} | MIT | threejs.org | three.LICENSE.txt */` },
});
await copyFile(new URL("node_modules/three/LICENSE", root), new URL("assets/three.LICENSE.txt", root));
const { positions, sizes, brightness } = particleData.createParticleData(2300);
const dots = [];
for (let index = 0; index < sizes.length; index++) {
  const z = positions[index * 3 + 2];
  const scale = 7.8 / (7.8 - z);
  const x = 500 + positions[index * 3] * scale * 140;
  const y = 500 - positions[index * 3 + 1] * scale * 140;
  const opacity = brightness[index] * (0.2 + (z + 2.6) / 5.2 * 0.75);
  dots.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(sizes[index] * 0.48).toFixed(2)}" opacity="${opacity.toFixed(2)}"/>`);
}
await writeFile(new URL("assets/particle-sphere.svg", root), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g fill="#f5f5f5">${dots.join("")}</g></svg>\n`);
