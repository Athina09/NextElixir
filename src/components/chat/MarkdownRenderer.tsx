// Tiny, dependency-free markdown renderer. Supports:
//   #, ##, ### headings · lists (- and 1.) · | tables |
//   **bold**, *italic*, `inline code`
// Deliberately minimal to keep visual consistency with the terminal UI.

import { Fragment } from "react";

function inline(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) {
      parts.push(<strong key={i++} className="text-foreground">{t.slice(2, -2)}</strong>);
    } else if (t.startsWith("`")) {
      parts.push(
        <code key={i++} className="mono rounded-sm bg-panel-2 px-1 py-[1px] text-[12px] text-primary">
          {t.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(<em key={i++}>{t.slice(1, -1)}</em>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownRenderer({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const blocks: React.ReactElement[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const content = inline(h[2]);
      if (level === 1)
        blocks.push(
          <h1 key={key++} className="mt-1 text-[15px] font-semibold text-foreground">
            {content}
          </h1>,
        );
      else if (level === 2)
        blocks.push(
          <h2
            key={key++}
            className="mono mt-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            {content}
          </h2>,
        );
      else
        blocks.push(
          <h3 key={key++} className="mt-1 text-[13px] font-semibold text-foreground">
            {content}
          </h3>,
        );
      i++;
      continue;
    }
    // Tables
    if (line.trim().startsWith("|") && lines[i + 1]?.includes("---")) {
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table className="mono w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {header.map((h, idx) => (
                  <th
                    key={idx}
                    className="hairline-b bg-panel-2/60 px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="hairline-b">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-foreground">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    // Lists
    if (/^\s*[-•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (
        i < lines.length &&
        (/^\s*[-•]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-•]|\d+\.)\s+/, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List
          key={key++}
          className={
            (ordered ? "list-decimal" : "list-disc") +
            " ml-5 space-y-1 text-[13px] text-foreground/90"
          }
        >
          {items.map((it, idx) => (
            <li key={idx}>{inline(it)}</li>
          ))}
        </List>,
      );
      continue;
    }
    // Paragraph
    blocks.push(
      <p key={key++} className="text-[13px] leading-relaxed text-foreground/90">
        {inline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-2.5">{blocks.map((b, idx) => <Fragment key={idx}>{b}</Fragment>)}</div>;
}
