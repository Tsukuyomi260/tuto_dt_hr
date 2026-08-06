/** Indicateur « l'agent réfléchit » — boucle lente de 1,25 s, calme mais visible. */
export function Thinking() {
  return (
    <div className="animate-rise flex items-center gap-2 self-start rounded-[6px_18px_18px_6px] border border-line border-l-[2.5px] border-l-agent-edge bg-surface px-3.5 py-2.5">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="animate-dot block size-1.5 rounded-full bg-agent-edge opacity-35"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
      <span className="text-[12.5px] text-ink-2">Le tuteur réfléchit…</span>
    </div>
  );
}
