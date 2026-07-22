import { lazy, Suspense } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { LatexToolbarButton } from "./ToolbarButton.tsx";
import { useLatexEditor } from "./useLatexEditor.ts";

// MathJax (pulled in by LatexModal -> renderer.ts) is a large dependency,
// so it's split into its own chunk and only fetched once the user actually
// opens the LaTeX editor.
const LatexModal = lazy(() =>
  import("./LatexModal.tsx").then((m) => ({ default: m.LatexModal }))
);

// Single mount point for the whole LaTeX feature (toolbar button + modal),
// so App.tsx only needs to render <LatexFeature />, and stays unaffected by
// how this feature is implemented internally.
export function LatexFeature(props: {
  excalidrawAPI: ExcalidrawImperativeAPI | undefined;
}) {
  const latex = useLatexEditor(props.excalidrawAPI);

  return (
    <>
      <LatexToolbarButton onClick={latex.openCreate} />
      {latex.editor && (
        <Suspense fallback={null}>
          <LatexModal
            initialSource={latex.editor.mode === "edit" ? latex.editor.source : undefined}
            initialDisplayMode={
              latex.editor.mode === "edit" ? latex.editor.displayMode : undefined
            }
            initialExtensions={
              latex.editor.mode === "edit" ? latex.editor.extensions : undefined
            }
            onCancel={latex.close}
            onSubmit={latex.submit}
          />
        </Suspense>
      )}
    </>
  );
}
