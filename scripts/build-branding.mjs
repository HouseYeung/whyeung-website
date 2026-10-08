import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
import brand from "./brand-mark.cjs";

const root = new URL("../", import.meta.url);
const path = brand.EAGLE_PATH;
const mark = (color) => `<path d="${path}" fill="${color}" fill-rule="evenodd"/>`;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 84"><title>Whyeung eagle W</title>${mark("#0a0a0b")}</svg>\n`;
await writeFile(new URL("assets/eagle-w.svg", root), logo);
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Whyeung eagle W</title><style>.badge{fill:#0a0a0b}.eagle{fill:#fafaf9}@media(prefers-color-scheme:dark){.badge{fill:#fafaf9}.eagle{fill:#09090b}}</style><rect class="badge" width="100" height="100" rx="24"/><path class="eagle" d="${path}" transform="translate(5 12) scale(.9)" fill-rule="evenodd"/></svg>\n`;
await writeFile(new URL("favicon.svg", root), favicon);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#0a0a0b"/><g transform="translate(5 12) scale(.9)">${mark("#fafaf9")}</g></svg>`;
await writeFile(new URL("assets/eagle-apple-touch-icon.png", root), new Resvg(icon).render().asPng());
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><radialGradient id="halo"><stop stop-color="#242428"/><stop offset="1" stop-color="#020203"/></radialGradient></defs>
<rect width="1200" height="630" fill="#020203"/>
<circle cx="1030" cy="430" r="470" fill="url(#halo)"/>
<g transform="translate(72 67) scale(.72)">${mark("#fafafa")}</g>
<text x="168" y="112" font-family="Arial" font-size="31" font-weight="700" fill="#fafafa">Whyeung Digital LLC</text>
<g fill="#fafafa" font-family="Arial" font-size="93" font-weight="700" letter-spacing="-3"><text x="76" y="327">Software for</text><text x="76" y="438">the AI era.</text></g>
<text x="80" y="565" font-family="Arial" font-size="23" fill="#a1a1aa">United States + Japan</text>
<text x="1118" y="565" text-anchor="end" font-family="Arial" font-size="23" fill="#a1a1aa">Makers of Vocena</text>
<g transform="translate(925 193) scale(2.1)" opacity=".07">${mark("#fafafa")}</g>
</svg>`;
await writeFile(new URL("assets/og-eagle-ai-era.png", root), new Resvg(card, { font: { loadSystemFonts: true, defaultFontFamily: "Arial" } }).render().asPng());
