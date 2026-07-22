// MathJax TeX packages ("extensions" in MathJax's own docs:
// https://docs.mathjax.org/en/latest/input/tex/extensions/index.html) that
// make sense as user-facing on/off toggles. A few packages are left out on
// purpose:
// - base/newcommand/configmacros/tagformat/setoptions/noerrors/noundefined
//   are infrastructure, always loaded regardless of selection.
// - colorv2 is a legacy duplicate of "color" (would conflict with it).
// - autoload/require dynamically fetch further packages at runtime, which
//   doesn't fit a statically bundled offline webview.
export interface LatexExtensionOption {
  id: string;
  label: string;
}

export const EXTENSION_OPTIONS: LatexExtensionOption[] = [
  { id: "action", label: "Interactive toggle/tooltip" },
  { id: "ams", label: "AMS math" },
  { id: "amscd", label: "AMS commutative diagrams" },
  { id: "bbox", label: "bbox (colored boxes)" },
  { id: "boldsymbol", label: "\\boldsymbol, \\bm" },
  { id: "braket", label: "Bra-ket notation" },
  { id: "bussproofs", label: "Proof trees" },
  { id: "cancel", label: "\\cancel" },
  { id: "cases", label: "Cases / numcases" },
  { id: "centernot", label: "\\centernot" },
  { id: "color", label: "\\color" },
  { id: "colortbl", label: "Colored table cells" },
  { id: "empheq", label: "empheq" },
  { id: "enclose", label: "\\enclose" },
  { id: "extpfeil", label: "Extensible arrows" },
  { id: "gensymb", label: "Units (°, %, …)" },
  { id: "html", label: "\\href, \\class, …" },
  { id: "mathtools", label: "mathtools" },
  { id: "mhchem", label: "Chemistry (mhchem)" },
  {
    id: "physics",
    label: "Physics (\\pdv, \\vb, \\bra, \\ket, …) — redefines \\div",
  },
  { id: "textcomp", label: "\\textdegree, …" },
  { id: "unicode", label: "\\unicode{}" },
  { id: "upgreek", label: "Upright Greek" },
  { id: "verb", label: "\\verb" },
];

// Off by default: most formulas only need base TeX, and packages like
// physics/braket actively change the meaning of common macros (\div, \bra),
// so users should opt in rather than be surprised by them.
export const DEFAULT_EXTENSIONS: string[] = [];
