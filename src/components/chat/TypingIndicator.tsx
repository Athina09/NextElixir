export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Assistant is reasoning
      </span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-primary/70"
            style={{
              animation: "chatdot 1.1s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <style>{`@keyframes chatdot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}`}</style>
    </div>
  );
}
