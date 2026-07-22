import { useEffect, useRef, useState } from "react";
import { Button } from "@excalidraw/excalidraw";
import "./styles.css";

// Excalidraw's top menu is a 3-column grid (left menu / centered shapes
// toolbar / right-corner UI via renderTopRightUI), so there's no prop to
// render content directly beside the centered toolbar island. Instead we
// measure the toolbar's own position and float a same-styled ".Island" box
// right next to it, keeping it in sync via ResizeObserver so it still lines
// up if the toolbar's width changes (e.g. the "more tools" button
// appearing/disappearing, or the window resizing).
//
// Two things can shrink the space actually available for that: narrow
// viewports (Excalidraw's mobile layout lets the toolbar grow to fill
// nearly the full width) and the library sidebar opening on the right edge
// (it overlays independently of the toolbar's own centered position, so at
// most viewport widths the sidebar's left edge -- not the window's -- is
// the real boundary; naively using window.innerWidth would render the
// button underneath the sidebar panel, out of reach). A MutationObserver
// re-locates the toolbar if the mobile layout swaps in a different element
// and picks up the sidebar opening/closing, and the final position is
// clamped against whichever boundary is closer (overlapping the toolbar's
// own edge in the worst case, rather than disappearing).
export function LatexToolbarButton(props: { onClick: () => void }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

  useEffect(() => {
    const excalidrawRoot = anchorRef.current?.closest(".excalidraw");
    if (!excalidrawRoot) {
      return;
    }

    let toolbar: Element | null = null;
    let sidebar: Element | null = null;
    const toolbarObserver = new ResizeObserver(reposition);
    const sidebarObserver = new ResizeObserver(reposition);

    function reposition() {
      const rect = toolbar?.getBoundingClientRect();
      // Zen mode (and anything else that hides the toolbar without removing
      // it, e.g. via width/height: 0 + visibility: hidden rather than
      // display: none) collapses it to an empty rect instead of making
      // `toolbar` null; treat that the same as "no toolbar" so the button
      // doesn't end up floating at a stale/degenerate position.
      if (!toolbar || !rect || (rect.width === 0 && rect.height === 0)) {
        setStyle({ opacity: 0, pointerEvents: "none" });
        return;
      }
      // The button is square (see .excalidraw-latex-island-button), so its
      // own width tracks the toolbar's height; use that instead of
      // measuring the button itself, which may still be at its old
      // position/size when this runs.
      const size = rect.height + 6;
      const rightBound = sidebar
        ? Math.min(window.innerWidth, sidebar.getBoundingClientRect().left)
        : window.innerWidth;
      const maxLeft = rightBound - size - 8;
      const left = Math.max(8, Math.min(rect.right + 8, maxLeft));
      setStyle({
        position: "fixed",
        top: rect.top,
        left,
        height: rect.height,
        opacity: 1,
        pointerEvents: "auto",
      });
    }

    // Re-finds the toolbar/sidebar elements (Excalidraw can swap either for
    // a different node, e.g. across the mobile/desktop breakpoint, or when
    // the sidebar opens/closes/switches tabs) and keeps the ResizeObservers
    // pointed at whatever's currently there.
    const sync = () => {
      const foundToolbar = excalidrawRoot.querySelector(".Island.App-toolbar");
      if (foundToolbar !== toolbar) {
        if (toolbar) {
          toolbarObserver.unobserve(toolbar);
        }
        toolbar = foundToolbar;
        if (toolbar) {
          toolbarObserver.observe(toolbar);
        }
      }

      const foundSidebar = excalidrawRoot.querySelector(".Island.sidebar");
      if (foundSidebar !== sidebar) {
        if (sidebar) {
          sidebarObserver.unobserve(sidebar);
        }
        sidebar = foundSidebar;
        if (sidebar) {
          sidebarObserver.observe(sidebar);
        }
      }

      reposition();
    };

    sync();

    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(excalidrawRoot, { childList: true, subtree: true });

    window.addEventListener("resize", reposition);
    return () => {
      toolbarObserver.disconnect();
      sidebarObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", reposition);
    };
  }, []);

  return (
    <div ref={anchorRef} className="Island excalidraw-latex-island" style={style}>
      <Button
        className="excalidraw-latex-island-button"
        title="Insert LaTeX Formula"
        onSelect={props.onClick}
      >
        Σ
      </Button>
    </div>
  );
}
