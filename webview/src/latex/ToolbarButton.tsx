import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDevice } from "@excalidraw/excalidraw";
import "./styles.css";

// This file targets internal, unexported Excalidraw DOM (class names owned
// by its private ToolButton/MobileMenu components, not its public API), as
// of @excalidraw/excalidraw@0.18.1. There's no stability guarantee across
// version bumps: DESKTOP_TOOLBAR_ROW_SELECTOR/MOBILE_TOOLS_ROW_SELECTOR
// silently not matching means the button just doesn't appear (see the
// `!container` check below), while the ToolIcon_type_button/ToolIcon__icon/
// App-toolbar__divider class names below only risk a visual mismatch if
// renamed. If the button vanishes or looks off after bumping that
// dependency, start here.
const DESKTOP_TOOLBAR_ROW_SELECTOR = ".Island.App-toolbar .Stack.Stack_horizontal";
const MOBILE_TOOLS_ROW_SELECTOR = ".mobile-misc-tools-container";

// Portals into a DOM node inside Excalidraw's own UI so the button flows
// inline with Excalidraw's own layout (sizing, position, wrapping) instead
// of needing its own tracking logic. Excalidraw can unmount or swap the
// target across renders (view mode toggling, the mobile/desktop breakpoint,
// sidebar changes), hence re-locating it via MutationObserver rather than a
// one-shot query.
function usePortalContainer(selector: string): Element | null {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    const excalidrawRoot = document.querySelector(".excalidraw");
    if (!excalidrawRoot) {
      return;
    }

    const sync = () => setContainer(excalidrawRoot.querySelector(selector));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(excalidrawRoot, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selector]);

  return container;
}

// Below Excalidraw's own mobile breakpoint it swaps in a MobileMenu whose
// toolbar island grows to fill nearly the full width, leaving no room to
// place a button beside it the way the desktop toolbar allows; mobile has
// its own dedicated row for extra tool buttons (lock/hand/pen mode/sidebar
// trigger) instead. Either way the button becomes a real, portaled child of
// Excalidraw's own row rather than a separately positioned element, so it
// gets Excalidraw's own sizing/wrapping/overflow behavior for free.
export function LatexToolbarButton(props: { onClick: () => void }) {
  const device = useDevice();
  const container = usePortalContainer(
    device.editor.isMobile ? MOBILE_TOOLS_ROW_SELECTOR : DESKTOP_TOOLBAR_ROW_SELECTOR
  );

  if (!container) {
    return null;
  }

  // Replicates the markup Excalidraw's own internal ToolButton renders for
  // its "button"-type tool icons (e.g. the "more tools" trigger) -- a plain,
  // unbordered button wrapping a .ToolIcon__icon -- rather than using the
  // exported <Button>, whose border/background is meant for standalone
  // buttons like this dialog's own Cancel/Insert, not toolbar icons.
  // ToolButton itself isn't exported, so this is hand-rolled from its
  // output classes instead.
  return createPortal(
    <>
      {/* Sets this button visually apart from the shape tools it's appended
          after, matching the same divider Excalidraw's own toolbar uses
          elsewhere in this row (e.g. before "more tools"). Mobile's row is
          a short, purpose-built list (lock/hand/pen mode/sidebar trigger)
          without any dividers of its own, so this doesn't belong there. */}
      {!device.editor.isMobile && <div className="App-toolbar__divider" />}
      <button
        type="button"
        className="ToolIcon_type_button ToolIcon"
        title="Insert LaTeX Formula"
        aria-label="Insert LaTeX Formula"
        onClick={props.onClick}
      >
        <div className="ToolIcon__icon" aria-hidden="true">
          Σ
        </div>
      </button>
    </>,
    container
  );
}
