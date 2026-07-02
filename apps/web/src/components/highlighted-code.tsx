import { type ReactNode } from "react";

/**
 * Tiny dependency-free TS/JS highlighter. Tokenizes comments → strings → numbers
 * → keywords in one pass; everything else inherits the surrounding text color.
 * (Syntax colors are data coloring, not UI chrome, so the multi-hue palette is fine.)
 */
const PATTERN =
  "(\\/\\/[^\\n]*)" + // 1: line comment
  "|(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)" + // 2: string
  "|(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?\\b)" + // 3: number / hex
  "|(\\b(?:import|from|export|default|const|let|var|async|await|function|return|new|true|false|null|undefined|type|interface|as|of|in)\\b)"; // 4: keyword

const CLASS = {
  comment: "text-zinc-600 italic",
  string: "text-success",
  number: "text-info",
  keyword: "text-accent-hover",
} as const;

export function HighlightedCode({ code }: { code: string }) {
  const nodes: ReactNode[] = [];
  const re = new RegExp(PATTERN, "g");
  let last = 0;
  let key = 0;

  for (let m = re.exec(code); m !== null; m = re.exec(code)) {
    if (m.index > last) nodes.push(code.slice(last, m.index));
    const cls = m[1] ? CLASS.comment : m[2] ? CLASS.string : m[3] ? CLASS.number : CLASS.keyword;
    nodes.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) nodes.push(code.slice(last));

  return <>{nodes}</>;
}
