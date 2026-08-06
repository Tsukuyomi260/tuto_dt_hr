/**
 * « Le tuteur réfléchit » — boucle à 1,1 s. Un rythme légèrement rapide fait
 * paraître l'attente plus courte qu'elle ne l'est, à durée réelle identique.
 */
export function Thinking() {
  return (
    <div className="animate-emerge flex items-center gap-2.5 self-start rounded-[8px_20px_20px_8px] border border-line border-l-[3px] border-l-agent-edge bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-1)]">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="animate-dot block size-1.5 rounded-full bg-agent-edge"
            style={{ animationDelay: `${i * 0.14}s` }}
          />
        ))}
      </span>
      <span className="t-caption text-ink-2">Le tuteur réfléchit…</span>
    </div>
  );
}
