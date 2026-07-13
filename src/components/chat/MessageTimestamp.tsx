export function MessageTimestamp({ at }: { at: number }) {
  const d = new Date(at);
  const s = d.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit" });
  return <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{s}</span>;
}
