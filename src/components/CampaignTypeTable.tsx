import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";

export function CampaignTypeTable() {
  const { forecast } = useForecast();
  const rows = forecast?.campaignTypes ?? [];
  return (
    <div className="panel overflow-hidden">
      <div className="hairline-b px-4 py-3">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Campaign type performance
        </div>
        <div className="mt-0.5 text-[13px] font-medium">Efficiency by campaign class</div>
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-2 py-2 text-right font-medium">Spend</th>
            <th className="px-2 py-2 text-right font-medium">Revenue</th>
            <th className="px-2 py-2 text-right font-medium">ROAS</th>
            <th className="px-2 py-2 text-right font-medium">CTR</th>
            <th className="px-4 py-2 text-right font-medium">Conv Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.type} className="hairline-b hover:bg-panel-2/40">
              <td className="px-4 py-2.5">{r.type}</td>
              <td className="mono px-2 py-2.5 text-right">{formatINR(r.spend)}</td>
              <td className="mono px-2 py-2.5 text-right">{formatINR(r.revenue)}</td>
              <td className="mono px-2 py-2.5 text-right text-primary">
                {formatMultiple(r.roas)}
              </td>
              <td className="mono px-2 py-2.5 text-right text-muted-foreground">
                {formatPct(r.ctr, 2)}
              </td>
              <td className="mono px-4 py-2.5 text-right text-muted-foreground">
                {formatPct(r.conv, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
