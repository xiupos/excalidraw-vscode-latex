import { useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { LatexModalResult } from "./LatexModal.tsx";
import { getLatexData, insertLatexElement, updateLatexElement } from "./insert.ts";

const DOUBLE_CLICK_MS = 400;

export type LatexEditorState =
  | { mode: "create" }
  | {
      mode: "edit";
      elementId: string;
      source: string;
      displayMode: boolean;
      extensions: string[];
    };

// Owns the entire "insert/edit a LaTeX formula" feature: opening the modal
// (fresh or pre-filled from a double-clicked formula element) and applying
// its result to the scene. Kept as a single hook so LatexFeature.tsx is the
// only place that needs to know about it.
export function useLatexEditor(excalidrawAPI: ExcalidrawImperativeAPI | undefined) {
  const [editor, setEditor] = useState<LatexEditorState | null>(null);
  const lastClickRef = useRef<{ elementId: string; time: number } | null>(null);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    return excalidrawAPI.onPointerDown((_activeTool, pointerDownState) => {
      const element = pointerDownState.hit.element;
      if (!element || !getLatexData(element)) {
        lastClickRef.current = null;
        return;
      }
      const now = Date.now();
      const last = lastClickRef.current;
      if (last && last.elementId === element.id && now - last.time < DOUBLE_CLICK_MS) {
        lastClickRef.current = null;
        const latexData = getLatexData(element)!;
        setEditor({
          mode: "edit",
          elementId: element.id,
          source: latexData.source,
          displayMode: latexData.displayMode,
          extensions: latexData.extensions,
        });
      } else {
        lastClickRef.current = { elementId: element.id, time: now };
      }
    });
  }, [excalidrawAPI]);

  const openCreate = () => setEditor({ mode: "create" });
  const close = () => setEditor(null);

  const submit = (result: LatexModalResult) => {
    if (!excalidrawAPI || !editor) {
      return;
    }
    if (editor.mode === "create") {
      insertLatexElement(excalidrawAPI, result);
    } else {
      updateLatexElement(excalidrawAPI, editor.elementId, result);
    }
    setEditor(null);
  };

  return { editor, openCreate, close, submit };
}
