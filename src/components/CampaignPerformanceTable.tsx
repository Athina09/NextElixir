import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { ChannelLogo } from "@/components/PlatformLogos";

type SortKey = "name" | "channel" | "spend" | "revenue" | "roas" | "ctr" | "conv" | "confidence";

export function CampaignPerformanceTable() {
  const { forecast } = useForecast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "revenue",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const perPage = 10;

  const rows = useMemo(() => {
    const all = forecast?.campaigns ?? [];
    const filtered = all.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.channel.toLowerCase().includes(query.toLowerCase()) ||
        r.type.toLowerCase().includes(query.toLowerCase()),
    );
    filtered.sort((a: any, b: any) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      return a[sort.key] > b[sort.key] ? dir : a[sort.key] < b[sort.key] ? -dir : 0;
    });
    return filtered;
  }, [forecast, query, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  function header(label: string, key: SortKey, align: "left" | "right" = "right") {
    const active = sort.key === key;
    return (
      <th
        onClick={() =>
          setSort((s) =>
            s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
          )
        }
        className={`cursor-pointer select-none px-2 py-2 text-${align} font-medium ${
          active ? "text-foreground" : ""
        }`}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (
            sort.dir === "asc" ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          ) : null}
        </span>
      </th>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="hairline-b flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Campaign level forecast
          </div>
          <div className="mt-0.5 text-[13px] font-medium">
            {rows.length} campaigns · higher uncertainty at this level
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search campaigns"
            className="mono hairline-b w-52 rounded-sm bg-panel-2/60 py-1 pl-7 pr-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/60"
          />
        </div>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 z-10 bg-panel">
            <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              {header("Campaign", "name", "left")}
              {header("Channel", "channel", "left")}
              {header("Spend", "spend")}
              {header("Revenue", "revenue")}
              {header("ROAS", "roas")}
              {header("CTR", "ctr")}
              {header("Conv", "conv")}
              {header("Confidence", "confidence")}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="hairline-b transition hover:bg-panel-2/40">
                <td className="px-4 py-2">
                  <div className="text-foreground">{r.name}</div>
                  <div className="mono text-[10px] text-muted-foreground">{r.id} · {r.type}</div>
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ChannelLogo channel={r.channel} size={14} className="shrink-0" />
                    <span>{r.channel}</span>
                  </div>
                </td>
                <td className="mono px-2 py-2 text-right">{formatINR(r.spend)}</td>
                <td className="mono px-2 py-2 text-right">{formatINR(r.revenue)}</td>
                <td className="mono px-2 py-2 text-right text-primary">
                  {formatMultiple(r.roas)}
                </td>
                <td className="mono px-2 py-2 text-right text-muted-foreground">
                  {formatPct(r.ctr, 2)}
                </td>
                <td className="mono px-2 py-2 text-right text-muted-foreground">
                  {formatPct(r.conv, 2)}
                </td>
                <td className="mono px-2 py-2 text-right">
                  <span
                    className={
                      r.confidence > 0.75
                        ? "text-success"
                        : r.confidence > 0.6
                          ? "text-warning"
                          : "text-error"
                    }
                  >
                    {formatPct(r.confidence, 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hairline-t flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground">
        <span className="mono">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="hairline-b rounded-sm bg-panel-2/60 px-2 py-1 hover:text-foreground"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="hairline-b rounded-sm bg-panel-2/60 px-2 py-1 hover:text-foreground"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
