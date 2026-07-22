import {
  convertToExcalidrawElements,
  newElementWith,
  CaptureUpdateAction,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
  DataURL,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
  FileId,
} from "@excalidraw/excalidraw/element/types";
import { latexToDataUrl } from "./dataUrl";

export const LATEX_CUSTOM_DATA_KEY = "excalidrawLatex";

export interface ExcalidrawLatexData {
  version: 1;
  source: string;
  displayMode: boolean;
  extensions: string[];
  engine: "mathjax";
  // Size MathJax rendered the formula at, before any manual resize on the
  // canvas. Needed to re-apply the user's chosen scale after a re-edit,
  // since the newly rendered SVG's natural size can differ (e.g. the
  // formula got longer) from what the element is currently displayed at.
  naturalWidth: number;
  naturalHeight: number;
}

// customData is persisted in the .excalidraw JSON file, so it can come back
// from disk hand-edited, truncated, or written by an older version of this
// extension; treat it as untrusted input rather than casting it blindly.
// (A missing/zero naturalWidth or naturalHeight in particular would turn
// updateLatexElement's resize-preserving scale factor into Infinity/NaN.)
function isValidLatexData(data: unknown): data is ExcalidrawLatexData {
  if (!data || typeof data !== "object") {
    return false;
  }
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    d.engine === "mathjax" &&
    typeof d.source === "string" &&
    typeof d.displayMode === "boolean" &&
    Array.isArray(d.extensions) &&
    d.extensions.every((e) => typeof e === "string") &&
    Number.isFinite(d.naturalWidth) &&
    (d.naturalWidth as number) > 0 &&
    Number.isFinite(d.naturalHeight) &&
    (d.naturalHeight as number) > 0
  );
}

export function getLatexData(
  element: ExcalidrawElement
): ExcalidrawLatexData | undefined {
  // customData on a non-image element wouldn't map to a usable
  // fileId/width/height even if it happened to look like ours.
  if (element.type !== "image") {
    return undefined;
  }
  const data = (element.customData as Record<string, unknown> | undefined)?.[
    LATEX_CUSTOM_DATA_KEY
  ];
  return isValidLatexData(data) ? data : undefined;
}

function makeFileId(): FileId {
  return `latex-${crypto.randomUUID()}` as FileId;
}

function makeCustomData(
  source: string,
  displayMode: boolean,
  extensions: string[],
  naturalWidth: number,
  naturalHeight: number
) {
  return {
    [LATEX_CUSTOM_DATA_KEY]: {
      version: 1,
      source,
      displayMode,
      extensions,
      engine: "mathjax",
      naturalWidth,
      naturalHeight,
    } satisfies ExcalidrawLatexData,
  };
}

function registerLatexFile(
  api: ExcalidrawImperativeAPI,
  fileId: FileId,
  svg: string
) {
  const file: BinaryFileData = {
    id: fileId,
    mimeType: "image/svg+xml",
    dataURL: latexToDataUrl(svg) as DataURL,
    created: Date.now(),
  };
  api.addFiles([file]);
}

export interface LatexInsertParams {
  svg: string;
  width: number;
  height: number;
  source: string;
  displayMode: boolean;
  extensions: string[];
}

export function insertLatexElement(
  api: ExcalidrawImperativeAPI,
  params: LatexInsertParams
) {
  const fileId = makeFileId();
  registerLatexFile(api, fileId, params.svg);

  const appState = api.getAppState();
  const { x, y } = viewportCoordsToSceneCoords(
    { clientX: appState.width / 2, clientY: appState.height / 2 },
    appState
  );

  const [element] = convertToExcalidrawElements([
    {
      type: "image",
      fileId,
      x: x - params.width / 2,
      y: y - params.height / 2,
      width: params.width,
      height: params.height,
      customData: makeCustomData(
        params.source,
        params.displayMode,
        params.extensions,
        params.width,
        params.height
      ),
    },
  ]);

  api.updateScene({
    elements: [...api.getSceneElements(), element],
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}

export function updateLatexElement(
  api: ExcalidrawImperativeAPI,
  elementId: string,
  params: LatexInsertParams
) {
  // The modal is a blocking overlay, so the target element can't normally be
  // deleted while it's open; still, check before registering a new file so
  // a stale/removed elementId can't leave an orphaned, unreferenced file.
  const found = api.getSceneElements().find((el) => el.id === elementId);
  if (!found || found.type !== "image") {
    return;
  }
  const target: ExcalidrawImageElement = found;

  const fileId = makeFileId();
  registerLatexFile(api, fileId, params.svg);

  // Preserve any manual resize the user applied on the canvas: scale the
  // freshly rendered (natural) size by the same factor the previous natural
  // size was scaled by, instead of snapping back to natural size.
  const previous = getLatexData(target);
  const scaleX = previous ? target.width / previous.naturalWidth : 1;
  const scaleY = previous ? target.height / previous.naturalHeight : 1;
  const width = params.width * scaleX;
  const height = params.height * scaleY;

  const elements = api.getSceneElements().map((el) => {
    if (el.id !== elementId) {
      return el;
    }
    return newElementWith(target, {
      fileId,
      x: target.x + (target.width - width) / 2,
      y: target.y + (target.height - height) / 2,
      width,
      height,
      customData: {
        ...target.customData,
        ...makeCustomData(
          params.source,
          params.displayMode,
          params.extensions,
          params.width,
          params.height
        ),
      },
    });
  });

  api.updateScene({
    elements,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}
