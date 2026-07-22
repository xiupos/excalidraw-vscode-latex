import { Base64 } from "js-base64";

export function latexToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Base64.encode(svg)}`;
}
