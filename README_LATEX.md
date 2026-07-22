# Excalidraw LaTeX

This is a fork of [pomdtr/excalidraw-vscode](https://github.com/pomdtr/excalidraw-vscode) that adds support for inserting and editing LaTeX math formulas directly on the Excalidraw canvas. See [README.md](./README.md) for the base extension's own documentation (file formats, themes, libraries, etc.) — this document only covers what's different in this fork.

## Try it online

A static build of the webview (no VS Code required) is deployed to GitHub Pages:

**<https://xiupos.github.io/excalidraw-vscode-latex/>**

## What's new

- **Insert LaTeX formulas** — a "Σ" button next to the shapes toolbar opens a modal where you can type LaTeX, pick which [MathJax extension packages](https://docs.mathjax.org/en/latest/input/tex/extensions/index.html) to enable (e.g. `physics`, `mhchem`, `braket`), and preview the rendered formula live before inserting it.
- **Fully editable afterwards** — a formula is inserted as a normal Excalidraw image element (an SVG rendered by [MathJax](https://www.mathjax.org/)), so it resizes, moves, and exports exactly like any other image. The original LaTeX source, display-mode flag, and enabled extensions are preserved in the element's `customData`, so double-clicking a formula reopens the same modal for editing — including after saving and reopening the file.
- **`.excalidraw` schema stays compatible** — formulas don't introduce a new element type; tools that don't know about this fork just see a regular image.
- **Rebranded package** — published as `xiupos.excalidraw-vscode-latex` rather than the upstream `pomdtr.excalidraw-editor`, so it can be installed side by side with the original extension.

See [CHANGELOG_LATEX.md](./CHANGELOG_LATEX.md) for this fork's version-by-version history.

## Versioning

Versions look like `<upstream-version>-latex-<fork-version>`, e.g. `3.9.3-latex-1.0`:

- `<upstream-version>` (`3.9.3`) is the upstream [pomdtr/excalidraw-vscode](https://github.com/pomdtr/excalidraw-vscode) release this fork is currently based on.
- `<fork-version>` (`1.0`) tracks changes specific to this fork (the LaTeX feature and anything else added here), independently of upstream. It's bumped on its own for fork-only releases, and reset to `1.0` whenever `<upstream-version>` moves to a newer upstream release.

This is a valid (if unusual-looking) [semver](https://semver.org/) prerelease version, which has one practical consequence: VS Code's extension installer always considers `X.Y.Z-latex-*` older than a plain `X.Y.Z`. That only matters once, if you happen to have a plain-numbered build of this fork installed from before this scheme existed — installing over it needs `code --install-extension <file>.vsix --force` a single time; every release after that compares and upgrades normally.

Releases are cut by pushing a git tag matching `v<package.json version>` (e.g. `v3.9.3-latex-1.0`) to `master`. [.github/workflows/build-vsix.yml](./.github/workflows/build-vsix.yml) picks up the tag push, builds the `.vsix`, and publishes it as a GitHub Release with notes pulled from the matching `## <version>` section of [CHANGELOG_LATEX.md](./CHANGELOG_LATEX.md).

## Installation

This extension is **not published to the VS Code Marketplace**. Install it manually from a GitHub release:

1. Go to the [Releases page](https://github.com/xiupos/excalidraw-vscode-latex/releases) and download the `.vsix` file attached to the version you want.
2. Install it in VS Code, using either method:
   - **UI**: open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`), click the `...` menu at the top, choose **Install from VSIX...**, and select the downloaded file.
   - **CLI**: run `code --install-extension path/to/excalidraw-vscode-latex-3.9.3-latex-1.0.vsix`.

To update, repeat the same steps with a newer release's `.vsix` — it will overwrite the previously installed version.

## Building from source

```sh
npm install        # also installs webview/ dependencies
npm run package     # builds the extension host and the webview into a production bundle
npx @vscode/vsce package
```

This produces an `excalidraw-vscode-latex-3.9.3-latex-1.0.vsix` in the repository root, which can be installed with either method described above.
