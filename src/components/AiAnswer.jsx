import React from 'react';
import { ExternalLink, ArrowRight, Compass } from 'lucide-react';

// Renders the coach's markdown-ish answer as easy-to-scan blocks: section titles with an accent
// bar, numbered steps as badges, bullets, simple `|` tables, **bold** highlights, and interactive internal/external links.
const inline = (s) => {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\)]+\)|https?:\/\/[^\s]+)/g;
  return String(s).split(tokenRegex).map((part, i) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-amber-200">{part.slice(2, -2)}</strong>;
    }

    // Code: `code`
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-px rounded bg-white/[0.08] text-cyan-200 text-[0.92em]">{part.slice(1, -1)}</code>;
    }

    // Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2].trim();

      // Internal SWM Route (e.g. /balance, /codes, /3mdc, /dungeons, /catalog, /rune)
      if (url.startsWith('/')) {
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              const cleanUrl = url.replace(/^\//, '');
              const [view, queryStr] = cleanUrl.split('?');
              const params = {};
              if (queryStr) {
                new URLSearchParams(queryStr).forEach((v, k) => { params[k] = v; });
              }
              window.dispatchEvent(new CustomEvent('swm:navigate', { detail: { view, params } }));
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 my-0.5 mx-1 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-500/40 font-bold transition-all text-xs cursor-pointer shadow-sm group align-middle"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-45 transition-transform" />
            <span>{label}</span>
            <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        );
      }

      // External URL
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-semibold transition-colors mx-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline" />
        </a>
      );
    }

    // Bare URL: https://...
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-semibold transition-colors mx-0.5 break-all text-xs"
        >
          <span>{part.replace(/^https?:\/\/(www\.)?/, '').slice(0, 35)}...</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline" />
        </a>
      );
    }

    return part;
  });
};

function Table({ rows, k }) {
  const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const [head, ...body] = rows.filter((r) => !/^\|?\s*:?-{2,}/.test(r));
  return (
    <div key={k} className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-xs">
        <thead className="bg-white/[0.04] text-slate-300">
          <tr>{cells(head).map((c, i) => <th key={i} className="px-2.5 py-1.5 text-left font-bold whitespace-nowrap">{inline(c)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.06]">{cells(r).map((c, j) => <td key={j} className="px-2.5 py-1.5 align-top">{inline(c)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseBlocks(text) {
  const blocks = [];
  let list = null; // { type: 'ul' | 'ol', items: [] }
  let table = null;
  const flush = () => {
    if (list) { blocks.push(list); list = null; }
    if (table) { blocks.push({ type: 'table', rows: table }); table = null; }
  };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (/^\|.*\|$/.test(line)) { if (!table) { if (list) { blocks.push(list); list = null; } table = []; } table.push(line); return; }
    if (table) { blocks.push({ type: 'table', rows: table }); table = null; }
    const ol = line.match(/^(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^[-•*]\s+(.*)$/);
    if (ol || ul) {
      const type = ol ? 'ol' : 'ul';
      if (!list || list.type !== type) { if (list) blocks.push(list); list = { type, items: [] }; }
      list.items.push(ol ? ol[2] : ul[1]);
      return;
    }
    flush();
    const heading = line.match(/^#{1,4}\s+(.*)$/)
      || (line.startsWith('**') && line.endsWith('**') && line.indexOf('**', 2) === line.length - 2 && [null, line.slice(2, -2)])
      || (line.length <= 40 && /[:：]$/.test(line) && [null, line.replace(/[:：]$/, '')]);
    if (heading) blocks.push({ type: 'h', text: heading[1] });
    else blocks.push({ type: 'p', text: line });
  });
  flush();
  return blocks;
}

export default function AiAnswer({ text, className = '' }) {
  const blocks = parseBlocks(text);
  return (
    <div className={`text-sm text-slate-200 leading-relaxed space-y-2.5 ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === 'h') return (
          <div key={i} className="flex items-center gap-2 pt-1 first:pt-0">
            <span className="w-1 h-4 rounded-full bg-amber-400 shrink-0" />
            <span className="font-bold text-white">{inline(b.text)}</span>
          </div>
        );
        if (b.type === 'ol') return (
          <ol key={i} className="space-y-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center justify-center shrink-0">{j + 1}</span>
                <span className="min-w-0">{inline(it)}</span>
              </li>
            ))}
          </ol>
        );
        if (b.type === 'ul') return (
          <ul key={i} className="space-y-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />
                <span className="min-w-0">{inline(it)}</span>
              </li>
            ))}
          </ul>
        );
        if (b.type === 'table') return <Table key={i} k={i} rows={b.rows} />;
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}
