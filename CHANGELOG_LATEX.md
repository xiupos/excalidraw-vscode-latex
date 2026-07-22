# Changelog (LaTeX fork)

Changes specific to this fork. See [CHANGELOG.md](./CHANGELOG.md) for the upstream [pomdtr/excalidraw-vscode](https://github.com/pomdtr/excalidraw-vscode) history this fork is based on, and [README_LATEX.md](./README_LATEX.md) for the versioning scheme.

## 3.9.3-latex-1.2

- The [GitHub Pages demo](https://xiupos.github.io/excalidraw-vscode-latex/) now exposes "Open" and "Save" (Ctrl/Cmd+S) so visitors can load a local `.excalidraw` file and save changes back to it; the VS Code extension is unaffected, since it still manages the file itself
- Fixed the "Σ" button overlapping the shapes toolbar on narrow/mobile screens, and having a bordered/backgrounded look unlike the other toolbar icons: it's now inserted directly into Excalidraw's own toolbar (with the same divider Excalidraw itself uses before "more tools"), or on mobile its lock/hand/pen-mode row, as a plain icon button matching them exactly, instead of being floated at a separately computed position next to it
- Fixed the LaTeX formula textarea auto-zooming the page on focus on iOS Safari, which couldn't be undone afterwards since pinch-zoom is otherwise disabled on the canvas
- Fixed the LaTeX formula dialog not matching Excalidraw's own dialogs (Open/Save/Help/etc.): it now reuses their backdrop color and goes fullscreen with a close button on mobile, the same as they do

## 3.9.3-latex-1.1

- Fixed the "Σ" button rendering underneath the Library sidebar when it's pinned open, and a related bug where clicks on the button in tight layouts could hit the shapes toolbar underneath it instead
- Added a `preview:demo` script for serving a production build of the demo site locally
- The [GitHub Pages demo](https://xiupos.github.io/excalidraw-vscode-latex/) is now installable as a PWA
- Added `AGENTS.md`/`CLAUDE.md` with contributor and fork-maintenance guidelines
- Added a GitHub Actions workflow that builds a `.vsix` on every push/PR and publishes it as a GitHub Release when a `v<version>` tag is pushed

## 3.9.3-latex-1.0

First release of this fork. Based on upstream 3.9.3, adds:

- Insert and edit LaTeX math formulas on the canvas (MathJax, rendered to SVG, selectable extension packages)
- A "Σ" button next to the shapes toolbar to open the formula editor
- A GitHub Pages demo of the webview
