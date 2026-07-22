import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { Button, useDevice } from "@excalidraw/excalidraw";
import { renderLatexToSvg, LatexRenderError } from "./renderer";
import { EXTENSION_OPTIONS, DEFAULT_EXTENSIONS } from "./extensions";

export interface LatexModalResult {
  source: string;
  displayMode: boolean;
  extensions: string[];
  svg: string;
  width: number;
  height: number;
}

interface PreviewState {
  svg: string | null;
  width: number;
  height: number;
  error: string | null;
}

const EMPTY_PREVIEW: PreviewState = {
  svg: null,
  width: 0,
  height: 0,
  error: null,
};

function renderPreview(
  source: string,
  displayMode: boolean,
  extensions: string[]
): PreviewState {
  if (!source.trim()) {
    return EMPTY_PREVIEW;
  }
  try {
    const { svg, width, height } = renderLatexToSvg(
      source,
      displayMode,
      extensions
    );
    return { svg, width, height, error: null };
  } catch (e) {
    const message =
      e instanceof LatexRenderError ? e.message : "Failed to render LaTeX";
    return { svg: null, width: 0, height: 0, error: message };
  }
}

// MathJax renders synchronously on the main thread; debouncing the preview
// keeps fast typing smooth. submit() below re-renders fresh instead of
// trusting this debounced state, so a formula inserted mid-debounce can
// never be stale.
const PREVIEW_DEBOUNCE_MS = 150;

export function LatexModal(props: {
  initialSource?: string;
  initialDisplayMode?: boolean;
  initialExtensions?: string[];
  onCancel: () => void;
  onSubmit: (result: LatexModalResult) => void;
}) {
  const [source, setSource] = useState(props.initialSource ?? "");
  const [displayMode, setDisplayMode] = useState(
    props.initialDisplayMode ?? true
  );
  const [extensions, setExtensions] = useState<Set<string>>(
    () => new Set(props.initialExtensions ?? DEFAULT_EXTENSIONS)
  );
  const [preview, setPreview] = useState<PreviewState>(() =>
    renderPreview(source, displayMode, Array.from(extensions))
  );
  // Matches the same check Excalidraw's own Dialog component uses to decide
  // whether Open/Save/Help/etc. go fullscreen, so this dialog does too.
  const isFullscreen = useDevice().viewport.isMobile;

  const toggleExtension = (id: string, enabled: boolean) => {
    setExtensions((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const selectAllExtensions = () =>
    setExtensions(new Set(EXTENSION_OPTIONS.map((o) => o.id)));
  const selectNoExtensions = () => setExtensions(new Set());

  const debouncedRender = useMemo(
    () =>
      debounce(
        (source: string, displayMode: boolean, extensions: string[]) => {
          setPreview(renderPreview(source, displayMode, extensions));
        },
        PREVIEW_DEBOUNCE_MS
      ),
    []
  );

  useEffect(() => {
    debouncedRender(source, displayMode, Array.from(extensions));
    return () => debouncedRender.cancel();
  }, [source, displayMode, extensions, debouncedRender]);

  const canSubmit = Boolean(preview.svg) && !preview.error;

  const submit = () => {
    // Re-render fresh rather than trusting the debounced `preview` state, so
    // hitting Ctrl+Enter right after typing always submits what's currently
    // in the textarea, not a stale pre-debounce render.
    const fresh = renderPreview(source, displayMode, Array.from(extensions));
    if (!fresh.svg) {
      return;
    }
    props.onSubmit({
      source,
      displayMode,
      extensions: Array.from(extensions),
      svg: fresh.svg,
      width: fresh.width,
      height: fresh.height,
    });
  };

  // Read the latest callbacks through a ref so the window keydown listener
  // can be mounted once ([] deps) instead of being torn down and re-added on
  // every keystroke.
  const latestRef = useRef({ onCancel: props.onCancel, submit });
  latestRef.current = { onCancel: props.onCancel, submit };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        latestRef.current.onCancel();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // submit() re-renders fresh and no-ops on invalid input, so it's
        // safe to call unconditionally rather than gating on the debounced
        // `canSubmit` (which could still reflect the previous keystroke).
        latestRef.current.submit();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    // Reuses Excalidraw's own .Modal/.Dialog/.Island classes (backdrop,
    // fullscreen-on-mobile switch, card chrome, title, close button) instead
    // of reimplementing them, so this dialog matches Excalidraw's own
    // dialogs (Open/Save/Help/etc.) instead of just resembling them. These
    // are internal, unexported classes (owned by Excalidraw's private Modal/
    // Dialog components, not its public API) as of @excalidraw/excalidraw@
    // 0.18.1, with no stability guarantee across version bumps -- a rename
    // would only risk a visual/behavioral mismatch here, not this dialog
    // failing to render at all, since none of it gates on a selector match
    // the way ToolbarButton.tsx's placement does.
    <div
      className={`Modal Dialog excalidraw-latex-dialog${isFullscreen ? " Dialog--fullscreen" : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="Modal__background" onClick={props.onCancel} />
      <div
        className="Modal__content"
        style={{ "--max-width": "480px" } as React.CSSProperties}
      >
        <div className="Island">
          <h2 className="Dialog__title">
            <span className="Dialog__titleContent">LaTeX Formula</span>
          </h2>
          {isFullscreen && (
            <button
              className="Dialog__close"
              onClick={props.onCancel}
              title="Close"
              aria-label="Close"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="Dialog__content excalidraw-latex-content">
            <textarea
              autoFocus
              value={source}
              placeholder="e.g. e^{i\pi} + 1 = 0"
              onChange={(e) => setSource(e.target.value)}
              rows={4}
            />
            <label className="excalidraw-latex-checkbox">
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
              />
              Display mode
            </label>
            <details className="excalidraw-latex-extensions">
              <summary>MathJax extensions ({extensions.size} enabled)</summary>
              <div className="excalidraw-latex-extensions-controls">
                <button type="button" onClick={selectAllExtensions}>
                  Select all
                </button>
                <button type="button" onClick={selectNoExtensions}>
                  Select none
                </button>
              </div>
              <div className="excalidraw-latex-extensions-grid">
                {EXTENSION_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="excalidraw-latex-checkbox"
                    title={option.label}
                  >
                    <input
                      type="checkbox"
                      checked={extensions.has(option.id)}
                      onChange={(e) =>
                        toggleExtension(option.id, e.target.checked)
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </details>
            <div className="excalidraw-latex-preview">
              {preview.error && (
                <span className="excalidraw-latex-error">{preview.error}</span>
              )}
              {preview.svg && (
                <div dangerouslySetInnerHTML={{ __html: preview.svg }} />
              )}
              {!preview.svg && !preview.error && (
                <span className="excalidraw-latex-placeholder">
                  Preview will appear here
                </span>
              )}
            </div>
            <div className="excalidraw-latex-actions">
              <Button
                className="excalidraw-latex-text-button"
                onSelect={props.onCancel}
              >
                Cancel
              </Button>
              <Button
                className="excalidraw-latex-text-button"
                selected
                disabled={!canSubmit}
                onSelect={submit}
              >
                {props.initialSource !== undefined ? "Update" : "Insert"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
