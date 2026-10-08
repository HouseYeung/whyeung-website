import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry,
  Float32BufferAttribute, ShaderMaterial, Points,
} from "three";
import particleData from "./particle-data.cjs";

const { createParticleData, choosePointCount, canAnimate } = particleData;
const hero = document.querySelector("[data-particle-hero]");
const canvas = document.querySelector("[data-particle-canvas]");
const toggle = document.querySelector("[data-particle-toggle]");

if (hero && canvas) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)");
  const state = { visible: true, hidden: document.hidden, reduced: reduced.matches, paused: false, contextLost: false };
  let renderer, geometry, material, resizeObserver, visibilityObserver;
  let cleanup = () => {};

  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 30);
    camera.position.z = 7.8;
    const data = createParticleData(choosePointCount(innerWidth, coarse.matches));
    geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute("aSize", new Float32BufferAttribute(data.sizes, 1));
    geometry.setAttribute("aBrightness", new Float32BufferAttribute(data.brightness, 1));
    material = new ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 }, uRadius: { value: 2.6 } },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float aSize;
        attribute float aBrightness;
        uniform float uPixelRatio;
        uniform float uRadius;
        varying float vAlpha;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * worldPosition;
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = aSize * uPixelRatio * (7.8 / -viewPosition.z);
          float depth = smoothstep(-uRadius, uRadius, worldPosition.z);
          vAlpha = aBrightness * mix(0.2, 0.95, depth);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
          float edge = 1.0 - smoothstep(0.18, 0.5, distanceFromCenter);
          gl_FragColor = vec4(vec3(0.96), edge * vAlpha);
        }
      `,
    });
    const orb = new Points(geometry, material);
    orb.rotation.x = 0.12;
    orb.rotation.z = 0.08;
    scene.add(orb);
    let lastTime = null, lastFrame = -Infinity;
    let pointer = { x: 0, y: 0 };
    let tilt = { x: 0, y: 0 };
    let spin = 0;

    const updateToggle = () => {
      if (!toggle) return;
      toggle.hidden = state.reduced;
      toggle.setAttribute("aria-pressed", String(state.paused));
      toggle.setAttribute("aria-label", state.paused ? "Play particle animation" : "Pause particle animation");
    };
    const render = () => renderer.render(scene, camera);
    const tick = (time) => {
      // A calm 30fps background, independent of scroll and text opacity.
      if (time - lastFrame < 1000 / 30) return;
      const delta = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      lastFrame = time;
      spin += delta * 0.045;
      const follow = 1 - Math.exp(-delta * 3);
      tilt.x += (pointer.x - tilt.x) * follow;
      tilt.y += (pointer.y - tilt.y) * follow;
      orb.rotation.y = spin + tilt.x * 0.12;
      orb.rotation.x = 0.12 + tilt.y * 0.08;
      render();
    };
    const sync = () => {
      lastTime = null;
      renderer.setAnimationLoop(canAnimate(state) ? tick : null);
      hero.dataset.particleState = state.contextLost ? "fallback" : state.reduced ? "static" : canAnimate(state) ? "playing" : "paused";
      if (!state.contextLost) render();
      updateToggle();
    };
    const resize = () => {
      const width = hero.clientWidth, height = hero.clientHeight;
      const pixelRatio = Math.min(devicePixelRatio || 1, coarse.matches ? 1.25 : 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // The sphere fills the hero without clipping its edges on narrow screens.
      camera.position.z = camera.aspect < 1 ? 7.8 / camera.aspect : 7.8;
      camera.updateProjectionMatrix();
      material.uniforms.uPixelRatio.value = pixelRatio;
      render();
    };
    const onVisibility = () => { state.hidden = document.hidden; sync(); };
    const onReduced = (event) => { state.reduced = event.matches; pointer = { x: 0, y: 0 }; sync(); };
    const onToggle = () => { state.paused = !state.paused; sync(); };
    const onPointer = (event) => {
      if (coarse.matches || state.reduced || state.paused || event.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointer.y = (event.clientY - rect.top) / rect.height * 2 - 1;
    };
    const onLeave = () => { pointer = { x: 0, y: 0 }; };
    const onLost = (event) => {
      event.preventDefault();
      state.contextLost = true;
      hero.classList.remove("has-webgl");
      sync();
    };
    const onRestored = () => { state.contextLost = false; resize(); hero.classList.add("has-webgl"); sync(); };
    const onPageHide = (event) => { if (!event.persisted) cleanup(); };

    resize();
    hero.classList.add("has-webgl");
    sync();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hero);
    visibilityObserver = new IntersectionObserver((entries) => {
      state.visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 });
    visibilityObserver.observe(hero);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onReduced);
    toggle?.addEventListener("click", onToggle);
    hero.addEventListener("pointermove", onPointer, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    window.addEventListener("pagehide", onPageHide);
    cleanup = () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReduced);
      toggle?.removeEventListener("click", onToggle);
      hero.removeEventListener("pointermove", onPointer);
      hero.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("pagehide", onPageHide);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  } catch {
    // Unsupported / blocked WebGL never prevents reading or using the website.
    renderer?.setAnimationLoop(null);
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    geometry?.dispose();
    material?.dispose();
    renderer?.dispose();
    hero.classList.remove("has-webgl");
    hero.dataset.particleState = "fallback";
    if (toggle) toggle.hidden = true;
  }
}
