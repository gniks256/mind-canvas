import { useEffect, useMemo, useRef, useState } from "react";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  notes: Note[];
  excludeId?: string | null;
  onPick: (note: Note) => void;
  onClose: () => void;
  /** Fixed coordinates (caret position or button anchor). */
  anchor: { x: number; y: number } | null;
  /** Initial query, e.g. typed after `@`. */
  initialQuery?: string;
};

export function NoteSearchPopup({
  notes,
  excludeId,
  onPick,
  onClose,
  anchor,
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => n.id !== excludeId)
      .filter((n) =>
        q ? (n.title || "Untitled").toLowerCase().includes(q) : true,
      )
      .slice(0, 8);
  }, [notes, excludeId, query]);

  useEffect(() => setActive(0), [query]);

  if (!anchor) return null;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const n = filtered[active];
      if (n) onPick(n);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Clamp to viewport
  const top = Math.min(anchor.y, window.innerHeight - 280);
  const left = Math.min(anchor.x, window.innerWidth - 288);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onMouseDown={onClose}
        aria-hidden
      />
      <div
        className="fixed z-50 w-72 rounded-xl border border-hairline bg-popover shadow-float"
        style={{ top, left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-hairline px-3 py-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Link to note…"
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="thin-scroll max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No notes found</p>
          ) : (
            filtered.map((n, i) => (
              <button
                key={n.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => onPick(n)}
                className={cn(
                  "block w-full truncate px-3 py-1.5 text-left text-sm transition-colors",
                  i === active
                    ? "bg-accent text-foreground"
                    : "text-foreground/80 hover:bg-accent/60",
                )}
              >
                {n.title || "Untitled"}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
