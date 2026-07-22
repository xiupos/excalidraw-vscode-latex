import React from "react";
import ReactDOM from "react-dom";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type {
  BinaryFileData,
  DataURL,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";

import App from "../App";
import "@excalidraw/excalidraw/index.css";
import { renderLatexToSvg } from "../latex/renderer";
import { latexToDataUrl } from "../latex/dataUrl";
import { LATEX_CUSTOM_DATA_KEY, ExcalidrawLatexData } from "../latex/insert";

// This is a standalone, VS Code-free build of the webview (see
// vite.demo.config.ts) used for the GitHub Pages demo. It skips main.tsx's
// data-excalidraw-config/vscode.ts plumbing entirely and just mounts <App>
// with a small sample scene so visitors immediately see the LaTeX feature.
function buildSampleScene(): Pick<
  ExcalidrawInitialDataState,
  "elements" | "files"
> {
  const source = "e^{i\\pi} + 1 = 0";
  const displayMode = true;
  const extensions: string[] = ["ams"];
  const { svg, width, height } = renderLatexToSvg(
    source,
    displayMode,
    extensions
  );

  const fileId = "latex-demo-sample" as FileId;
  const file: BinaryFileData = {
    id: fileId,
    mimeType: "image/svg+xml",
    dataURL: latexToDataUrl(svg) as DataURL,
    created: Date.now(),
  };

  const [element] = convertToExcalidrawElements([
    {
      type: "image",
      fileId,
      x: 0,
      y: 0,
      width,
      height,
      customData: {
        [LATEX_CUSTOM_DATA_KEY]: {
          version: 1,
          source,
          displayMode,
          extensions,
          engine: "mathjax",
          naturalWidth: width,
          naturalHeight: height,
        } satisfies ExcalidrawLatexData,
      },
    },
  ]);

  return { elements: [element], files: { [fileId]: file } };
}

const prefersDark = window.matchMedia?.(
  "(prefers-color-scheme: dark)"
).matches;

ReactDOM.render(
  <React.StrictMode>
    <App
      name="excalidraw-latex-demo"
      theme={prefersDark ? "dark" : "light"}
      langCode="en"
      viewModeEnabled={false}
      dirty={false}
      enableLocalFileActions
      initialData={buildSampleScene()}
      imageParams={{
        exportBackground: true,
        exportWithDarkMode: false,
        exportScale: 1,
      }}
      onChange={() => {}}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
