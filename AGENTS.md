# AGENTS.md

Instructions for AI coding agents (and a useful map for human contributors too) working in this repository.

## What this repo is

`xiupos/excalidraw-vscode-latex` is a fork of [pomdtr/excalidraw-vscode](https://github.com/pomdtr/excalidraw-vscode), a VS Code extension that embeds the Excalidraw editor for `.excalidraw`/`.excalidraw.svg`/`.excalidraw.png` files. This fork adds one feature on top: inserting and editing LaTeX math formulas on the canvas via MathJax. See [README_LATEX.md](./README_LATEX.md) for the user-facing description and [CHANGELOG_LATEX.md](./CHANGELOG_LATEX.md) for the fork's release history.

Two workspaces:

- **`src/`** — the VS Code extension host (custom editor provider, commands, document model). Node/CommonJS, bundled with webpack (`webpack.config.js`).
- **`webview/`** — the React app that actually renders Excalidraw inside the editor's webview. Bundled with Vite. Has its own `package.json`/`node_modules`; the root `npm install` runs `cd webview && npm install` automatically (see root `package.json`'s `install` script).

## Design philosophy: stay fast-forward mergeable

This fork intends to keep pulling from upstream indefinitely. That only stays low-friction if upstream's own commits keep applying (ideally fast-forwarding) on top of this fork's history — which means **direct edits to upstream-owned files must be kept to an absolute minimum**, both in line count and in how long they'll plausibly stay merge-conflict-free.

In practice:

- New functionality lives in its own files/directories, not scattered through existing ones. The LaTeX feature is entirely contained in [webview/src/latex/](./webview/src/latex/); the only touches to pre-existing files are a single import and a single JSX child in [webview/src/App.tsx](./webview/src/App.tsx) mounting `<LatexFeature />`.
- Rebranding (package name, marketplace URL, `libraryReturnUrl`) is a handful of one-line string swaps in [src/editor.ts](./src/editor.ts) and [webview/src/App.tsx](./webview/src/App.tsx) — not a search-and-replace across the codebase.
- Before touching a file that isn't under `webview/src/latex/`, `webview/src/demo/`, ask: does this really need to change, or can the new behavior be expressed as an addition (new file, new prop, new wrapper component) instead? When you do have to touch a shared file, run `git diff HEAD -- <file>` afterwards and keep that diff as small and self-explanatory as possible.
- Two changelogs on purpose: [CHANGELOG.md](./CHANGELOG.md) is upstream's, kept byte-for-byte as upstream writes it (don't add fork entries there — that's exactly the kind of edit that causes merge conflicts on every future `git merge upstream/main`). Fork-specific changes go in [CHANGELOG_LATEX.md](./CHANGELOG_LATEX.md) instead.

If you're about to refactor something in an upstream-owned file "while you're in there," don't — open a separate, explicit discussion about it first. Drive-by refactors of upstream code are the single most likely thing to cause a painful future merge.

## Versioning

Format: `<upstream-version>-latex-<fork-version>`, e.g. `3.9.3-latex-1.0`. Full rationale (including a VS Code installer semver gotcha) is documented in [README_LATEX.md](./README_LATEX.md)'s Versioning section — read it before cutting a release or bumping the version in `package.json`.

## Building and running

```sh
npm install              # root; also installs webview/ deps
npm run build             # dev build (extension host + webview)
npm run package            # production build (what `vsce package` bundles)
npx @vscode/vsce package    # produces the .vsix in the repo root
```

Inside `webview/`:

```sh
npm run dev             # Vite dev server for the main webview
npm run build            # production build -> webview/dist (consumed by the extension)
npm run build:demo        # production build of the standalone demo -> webview/dist-demo
npm run preview:demo       # serve the built demo locally, for checking the production bundle/PWA behavior before deploying
npm run lint             # eslint
```

`webview/dist` and `webview/dist-demo` are build output (gitignored); don't hand-edit or commit anything in them.

### The demo site

[webview/demo.html](./webview/demo.html) + [webview/src/demo/main.tsx](./webview/src/demo/main.tsx) + [webview/vite.demo.config.ts](./webview/vite.demo.config.ts) is a standalone build of the webview (no VS Code host) deployed to GitHub Pages by [.github/workflows/deploy-demo.yml](./.github/workflows/deploy-demo.yml). It shares `webview/src/App.tsx` and everything under `webview/src/latex/` with the real extension — the only demo-specific code is the `main.tsx` entry point and the `acquireVsCodeApi` stub inlined in `demo.html`.

It's PWA-enabled via `vite-plugin-pwa`, configured only in `vite.demo.config.ts`. Its icons live in `webview/demo-public/`, a directory dedicated to the demo build's `publicDir` — deliberately not the conventional `webview/public/`, because Vite's default `publicDir` is shared by every config with the same project root, and a plain `public/` would get copied into the real extension's `webview/dist` output too. Keep it that way if you add more demo-only static assets.

## Testing changes

There is no automated test suite for the webview UI. Before calling a UI change done:

1. `webview/`: `npm run lint` and `npx tsc -b` (or `--force` if you want a full rebuild rather than incremental) should both be clean.
2. Exercise the change in a browser. `npm run dev` inside `webview/` starts a Vite dev server for `webview/index.html`, but that entry point calls `acquireVsCodeApi()` unconditionally at import time and will throw outside a real VS Code webview host — stub it the same way `demo.html` does (see the inline `<script>` at the top of [webview/demo.html](./webview/demo.html)) if you need a throwaway harness page for interactive debugging. Don't commit throwaway harness files; they're scratch, not fixtures.
3. `npm run package` at the repo root (or `npm run build` for a faster dev build) followed by `npx @vscode/vsce package` produces a real `.vsix` — installing that in an actual VS Code instance is the only way to verify extension-host-specific behavior (file associations, `customData` round-tripping through real file saves, etc.).

## Code style

- Follow the existing eslint config in each workspace (`.eslintrc.json` at root, `webview/eslint.config.js`) — don't introduce new rules or disable existing ones without a specific reason.
- No comments explaining *what* code does; only *why*, and only when it's non-obvious (a constraint, an invariant, a workaround). Several files under `webview/src/latex/` follow this pattern intentionally — use them as a reference.
- Match the surrounding file's formatting conventions (this project uses Prettier — `npm run prettier` / `npm run prettierfix` at the root checks/fixes it).

## Working with other contributors

This is a small fork that may pick up outside contributors over time. If you're an agent opening a PR or making a substantial change:

- Keep PRs scoped to one concern; don't bundle an unrelated upstream-file touch into a feature PR, for the fast-forward-mergeability reasons above.
- If a change is genuinely ambiguous in scope or intent (not just "which of two valid implementations"), prefer asking over guessing — see the Discussions link in [README.md](./README.md)'s "Note for Contributors" section for where that conversation should happen for human contributors; for an interactive agent session, ask the user directly.
- Update [CHANGELOG_LATEX.md](./CHANGELOG_LATEX.md) for user-facing fork changes, and [README_LATEX.md](./README_LATEX.md) if the change affects installation, versioning, or the feature list.
