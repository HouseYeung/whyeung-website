const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { buildSync } = require("esbuild");
const { createParticleData, choosePointCount, canAnimate } = require("./particle-data.cjs");
const root = join(__dirname, "..");
const read = (name) => readFileSync(join(root, name), "utf8");

test("Motion and the rejected label are entirely removed", () => {
  for (const name of ["index.html", "site.js", "site.css", "package.json", "package-lock.json"])
    assert.doesNotMatch(read(name), /WhyeungMotion|"motion"|assets\/vendor\/motion|Independent software company/);
  assert.ok(!existsSync(join(root, "assets/vendor/motion.js")));
  assert.doesNotMatch(read("site.js"), /opacity|IntersectionObserver|\.animate\(/);
  assert.doesNotMatch(read("index.html"), /class="[^"]*reveal|Gould|Sheridan|82801|PostalAddress/);
});
test("the 3D library is pinned, bundled locally and licensed", () => {
  const pkg = JSON.parse(read("package.json")); assert.equal(pkg.dependencies.three, "0.186.1");
  assert.ok(existsSync(join(root, "assets/particles.js")));
  assert.match(read("assets/three.LICENSE.txt"), /MIT License/);
  assert.match(read("scripts/particles-entry.js"), /from "three"/);
});
test("Three.js decorates a canvas, never moving or hiding readable content", () => {
  const html = read("index.html"); assert.match(html, /hero-orb" aria-hidden="true"/);
  assert.match(html, /data-particle-canvas/); assert.match(html, /data-particle-toggle/);
  assert.match(html, /aria-label="Pause particle animation"/);
  assert.doesNotMatch(read("scripts/particles-entry.js"), /\.style\.opacity|hero-inner|\.reveal|"h1"/);
  assert.match(read("site.css"), /pointer-events: none/);
});
test("the sphere is deterministic and has the expected point attributes", () => {
  const a = createParticleData(4600), b = createParticleData(4600);
  assert.equal(a.positions.length, 13800); assert.equal(a.sizes.length, 4600);
  assert.deepEqual(a.positions, b.positions);
  assert.deepEqual(a.brightness, b.brightness);
});
test("all particles are finite and lie on a spherical shell, not a flat circle", () => {
  const { positions, sizes, brightness } = createParticleData(4600);
  let front = 0, back = 0;
  for (let i = 0; i < sizes.length; i++) {
    const [x,y,z] = positions.slice(i * 3, i * 3 + 3);
    assert.ok([x,y,z,sizes[i],brightness[i]].every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(x,y,z)-2.6) < 0.027);
    assert.ok(sizes[i] >= 1.5 && sizes[i] <= 3.3);
    assert.ok(brightness[i] >= 0.55 && brightness[i] <= 1);
    z > 0 ? front++ : back++;
  }
  assert.ok(front > 2000 && back > 2000);
});
test("mobile / coarse pointers use fewer particles", () => {
  assert.equal(choosePointCount(390, false), 2000);
  assert.equal(choosePointCount(1440, true), 2000);
  assert.equal(choosePointCount(1440, false), 4600);
});
test("the animation runs only while visible and eligible", () => {
  const state = { visible: true, hidden: false, reduced: false, paused: false, contextLost: false };
  assert.equal(canAnimate(state), true);
  for (const flag of ["hidden", "reduced", "paused", "contextLost"])
    assert.equal(canAnimate({ ...state, [flag]: true }), false);
  assert.equal(canAnimate({ ...state, visible: false }), false);
});
test("a WebGL initialization failure leaves the static sphere and text usable", () => {
  const bundle = buildSync({ entryPoints:[join(__dirname,"particles-entry.js")], bundle:true, format:"cjs", external:["three"], platform:"node", write:false }).outputFiles[0].text;
  const removed = [], hero = { classList:{ remove:(name)=>removed.push(name) }, dataset:{} }, toggle = { hidden:false };
  vm.runInNewContext(bundle, {
    require: () => ({ WebGLRenderer: class { constructor() { throw new Error("No WebGL"); } } }),
    document:{querySelector:(selector)=>selector==="[data-particle-hero]"?hero:selector==="[data-particle-canvas]"?{}:toggle,hidden:false},
    matchMedia:()=>({matches:false}), innerWidth:1440,
  });
  assert.deepEqual(removed,["has-webgl"]);assert.equal(hero.dataset.particleState,"fallback");assert.equal(toggle.hidden,true);
  assert.ok(existsSync(join(root,"assets/particle-sphere.svg")));
});
test("the rotation has no flicker or brightness animation", () => {
  const source = read("scripts/particles-entry.js");
  assert.doesNotMatch(source,/sin\(|cos\(|uTime|Math\.random|opacity\s*=/);
  assert.match(source,/spin \+= delta \* 0\.045/);
  assert.match(source,/setAnimationLoop\(canAnimate\(state\)/);
});
test("WebGL resources are paused, resized and released correctly", () => {
  const source = read("scripts/particles-entry.js");
  for (const token of ["visibilitychange","webglcontextlost","webglcontextrestored","pagehide","ResizeObserver","geometry.dispose()","material.dispose()","renderer.dispose()"])
    assert.ok(source.includes(token), token);
});
test("site interactions do not depend on Three.js being available", async () => {
  const copyEvents={}, label={}, year={}, windowEvents={}; let copied;
  const nav={offsetHeight:64,classList:{toggle(){}}};
  vm.runInNewContext(read("site.js"), {
    document:{querySelector:(selector)=>selector==="[data-nav]"?nav:null,querySelectorAll:(selector)=>selector==="[data-year]"?[year]:selector==="[data-copy]"?[{dataset:{copy:"contact@whyeung.com"},querySelector:()=>label,addEventListener:(event,fn)=>copyEvents[event]=fn}]:[]},
    window:{scrollY:0,addEventListener:(event,fn)=>windowEvents[event]=fn,location:{}},
    navigator:{clipboard:{writeText:async(text)=>copied=text}},Date,setTimeout(){}
  });
  await copyEvents.click();assert.equal(copied,"contact@whyeung.com");assert.equal(label.textContent,"Copied");
  assert.equal(year.textContent,String(new Date().getFullYear()));
});
