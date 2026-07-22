import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { browserAdaptor } from "mathjax-full/js/adaptors/browserAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
// Each optional package (see extensions.ts) only becomes a valid name for
// TeX({ packages }) once its *Configuration module has run and registered
// itself; AllPackages.js side-effect-imports every one of them.
import "mathjax-full/js/input/tex/AllPackages.js";

RegisterHTMLHandler(browserAdaptor());

// fontCache "none" makes every output SVG fully self-contained (glyphs are
// inlined as <path> elements instead of <use>-references into a shared
// <defs> cache), which is required since each formula is stored as an
// independent image element/file in the .excalidraw document.
const svgOutput = new SVG({ fontCache: "none" });

// Infrastructure packages MathJax's TeX input needs regardless of which
// optional extensions (see extensions.ts) the user has picked.
const STRUCTURAL_PACKAGES = [
  "base",
  "newcommand",
  "configmacros",
  "tagformat",
  "textmacros",
  "setoptions",
  "noerrors",
  "noundefined",
];

const documentCache = new Map<string, ReturnType<typeof mathjax.document>>();

function getDocument(extensions: string[]) {
  // "physics" redefines macros that "braket" already provides (\bra, \ket,
  // \ip, …) and repurposes \div for the divergence operator instead of ÷,
  // so loading both at once makes MathJax's package system fight over the
  // same macro names. Prefer physics when both are selected.
  const packages = extensions.includes("physics")
    ? extensions.filter((p) => p !== "braket")
    : extensions;

  const key = [...packages].sort().join(",");
  let doc = documentCache.get(key);
  if (!doc) {
    doc = mathjax.document("", {
      InputJax: new TeX({
        packages: [...STRUCTURAL_PACKAGES, ...packages],
        // The "boldsymbol" package only defines \boldsymbol; \bm is a
        // commonly expected shorthand (from the standalone "bm" LaTeX
        // package) that MathJax doesn't ship, so alias it via configmacros.
        macros: packages.includes("boldsymbol")
          ? { bm: ["\\boldsymbol{#1}", 1] }
          : {},
      }),
      OutputJax: svgOutput,
    });
    documentCache.set(key, doc);
  }
  return doc;
}

// Pixels-per-ex used for the conversion pass; matches MathJax's default
// 16px em / 8px ex (exFactor 0.5) so glyph proportions look natural.
const EX_TO_PX = 8;

function exToPx(value: string | null): number {
  const match = /^(-?[\d.]+)ex$/.exec((value ?? "").trim());
  if (!match) {
    throw new Error(`Unexpected MathJax SVG unit: ${value}`);
  }
  return parseFloat(match[1]) * EX_TO_PX;
}

export interface LatexRenderResult {
  svg: string;
  width: number;
  height: number;
}

export class LatexRenderError extends Error {}

export function renderLatexToSvg(
  source: string,
  displayMode: boolean,
  extensions: string[]
): LatexRenderResult {
  const html = getDocument(extensions);
  const container = html.convert(source, {
    display: displayMode,
    em: 16,
    ex: EX_TO_PX,
  }) as unknown as HTMLElement;

  const errorNode = container.querySelector('g[data-mml-node="merror"]');
  if (errorNode) {
    throw new LatexRenderError(
      errorNode.querySelector("title")?.textContent || "Invalid LaTeX"
    );
  }

  const svgEl = container.querySelector("svg");
  if (!svgEl) {
    throw new LatexRenderError("MathJax did not produce an SVG element");
  }

  const width = exToPx(svgEl.getAttribute("width"));
  const height = exToPx(svgEl.getAttribute("height"));
  svgEl.setAttribute("width", `${width}`);
  svgEl.setAttribute("height", `${height}`);

  return { svg: svgEl.outerHTML, width, height };
}
