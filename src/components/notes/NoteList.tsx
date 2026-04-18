import { Pin, Search, Star, Plus } from "lucide-react";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (q: string) => void;
  onCreate: () => void;
  title: string;
};

export function NoteList({
  notes,
  selectedId,
  onSelect,
  query,
  onQuery,
  onCreate,
  title,
}: Props) {
  return (
    <div className="flex h-full w-80 flex-col border-r border-hairline bg-surface">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <button
            onClick={onCreate}
            className="rounded-md bg-primary p-1.5 text-primary-foreground shadow-soft transition-transform hover:scale-105"
            aria-label="New note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-md border border-hairline bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        {notes.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing here yet.
          </p>
        ) : (
          notes.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className={cn(
                "group mb-1 block w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                selectedId === n.id
                  ? "bg-accent"
                  : "hover:bg-accent/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex-1 truncate text-sm font-medium">
                  {n.title || "Untitled"}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {n.pinned && <Pin className="h-3 w-3 fill-current" />}
                  {n.favorite && <Star className="h-3 w-3 fill-current" />}
                </div>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {stripHtml(n.content) || "No additional text"}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatDate(n.updatedAt)}</span>
                {n.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
