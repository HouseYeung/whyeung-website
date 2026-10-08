const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const source = readFileSync(join(__dirname, "../site.js"), "utf8");

function boot({ reduced = false, missingLibrary = false, noWaapi = false, hash = "" } = {}) {
  const windowEvents = {}, documentEvents = {}, preferenceEvents = {};
  const hero = ["heading", "lead", "actions"].map((name) => ({ name, contains: (target) => target?.parent === name }));
  const cards = [0, 1, 2].map((index) => ({ index, contains: () => false }));
  const year = {}, copyLabel = {}, copyEvents = {}, calls = [], controls = [];
  const button = { dataset: { copy: "contact@whyeung.com" }, querySelector: () => copyLabel, addEventListener: (event, fn) => copyEvents[event] = fn };
  let copied, inViewCallback, observerStopped = false;
  const preference = { matches: reduced, addEventListener: (event, fn) => preferenceEvents[event] = fn };
  const motion = {
    stagger: (step) => (index) => index * step,
    animate: (elements, frames, options) => {
      calls.push({ elements, frames, options });
      const control = { completed: false, cancelled: false, finished: new Promise(() => {}), complete() { this.completed = true; }, cancel() { this.cancelled = true; } };
      controls.push(control); return control;
    },
    inView: (selector, callback) => { inViewCallback = callback; return () => observerStopped = true; }
  };
  const document = {
    documentElement: {}, activeElement: null,
    querySelector: () => null,
    querySelectorAll: (selector) => ({ ".hero-inner > *": hero, ".pillar.reveal": cards, "[data-year]": [year], "[data-copy]": [button] })[selector] || [],
    getElementById: (id) => id ? { contains: (node) => node.isAnchorDestination } : null,
    addEventListener: (event, fn) => documentEvents[event] = fn,
  };
  const window = { matchMedia: () => preference, WhyeungMotion: missingLibrary ? undefined : motion, location: { hash, href: "" }, scrollY: 0, addEventListener: (event, fn) => windowEvents[event] = fn };
  vm.runInNewContext(source, { window, document, Element: { prototype: noWaapi ? {} : { animate() {} } }, getComputedStyle: () => ({ getPropertyValue: () => "cubic-bezier(0.23, 1, 0.32, 1)" }), navigator: { clipboard: { writeText: async (text) => copied = text } }, setTimeout: () => {}, Date });
  return { window, windowEvents, documentEvents, preferenceEvents, preference, hero, cards, year, copyLabel, copyEvents, calls, controls, get copied() { return copied; }, get inViewCallback() { return inViewCallback; }, get observerStopped() { return observerStopped; } };
}

test("the requested label, pulse and old CSS entrance animations are removed", () => {
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");
  const css = readFileSync(join(__dirname, "../site.css"), "utf8");
  assert.doesNotMatch(html, /Independent software company|class="pill"|class="pulse"|Gould|Sheridan|82801|PostalAddress/);
  assert.doesNotMatch(css, /@keyframes (rise|ping)|\.js \.reveal|\.hero-inner > \*/);
  assert.ok(html.indexOf('src="./assets/vendor/motion.js"') < html.indexOf('src="./site.js"'));
  assert.ok(existsSync(join(__dirname, "../assets/vendor/motion.js")));
});
test("Motion animates the fresh hero with transform, opacity and a 60 ms stagger", () => {
  const app = boot(); assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].elements.length, 3);
  assert.equal(app.calls[0].options.duration, 0.5);
  assert.equal(app.calls[0].options.delay(2), 0.12);
  assert.deepEqual(Array.from(app.calls[0].frames.opacity), [0, 1]);
  assert.deepEqual(Array.from(app.calls[0].frames.transform), ["translateY(14px)", "translateY(0px)"]);
});
test("scroll reveal staggers company cards without returning a replay callback", () => {
  const app = boot(); assert.equal(app.inViewCallback(app.cards[2]), undefined);
  assert.equal(app.calls.length, 2); assert.equal(app.calls[1].options.delay, 0.12);
});
test("reduced motion keeps content static and core controls available", async () => {
  const app = boot({ reduced: true }); assert.equal(app.calls.length, 0); assert.equal(app.inViewCallback, undefined);
  await app.copyEvents.click(); assert.equal(app.copied, "contact@whyeung.com");
  assert.equal(app.year.textContent, String(new Date().getFullYear()));
});
test("a failed library load still leaves company content, year and copy usable", async () => {
  const app = boot({ missingLibrary: true }); assert.equal(app.calls.length, 0);
  await app.copyEvents.click(); assert.equal(app.copyLabel.textContent, "Copied");
  assert.equal(app.copied, "contact@whyeung.com");
});
test("a browser without WAAPI uses the same static fallback", () => {
  const app = boot({ noWaapi: true }); assert.equal(app.calls.length, 0); assert.equal(app.inViewCallback, undefined);
});
test("turning reduced motion on finishes active animations and disconnects observers", () => {
  const app = boot(); app.preference.matches = true; app.preferenceEvents.change({ matches: true });
  assert.ok(app.observerStopped); assert.ok(app.controls.every((a) => a.completed && a.cancelled));
  app.inViewCallback(app.cards[0]); assert.equal(app.calls.length, 1);
});
test("keyboard focus finishes the decorative animation around the focused control", () => {
  const app = boot(); app.documentEvents.focusin({ target: { parent: "actions" } });
  assert.ok(app.controls[0].completed && app.controls[0].cancelled);
});
test("anchor navigation finishes active motion and skips the landing destination", () => {
  const app = boot(); app.windowEvents.hashchange(); assert.ok(app.controls[0].cancelled);
  app.window.location.hash = "#contact"; app.inViewCallback({ isAnchorDestination: true, contains: () => false });
  assert.equal(app.calls.length, 1);
});
test("direct anchor loads do not animate the hero", () => {
  const app = boot({ hash: "#contact" }); assert.equal(app.calls.length, 0);
});
