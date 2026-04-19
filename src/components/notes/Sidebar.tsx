import { useMemo, useState } from "react";
import {
  Link as LinkIcon,
  Star,
  Hash,
  Folder as FolderIcon,
  Inbox,
  Plus,
  Sun,
  Moon,
  Trash2,
  ChevronRight,
  FileText,
} from "lucide-react";
import type { Folder, Note, View } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  notes: Note[];
  selectedId: string | null;
  folders: Folder[];
  tags: string[];
  view: View;
  onView: (v: View) => void;
  onSelectNote: (id: string) => void;
  onAddSubNote: (parentId: string) => void;
  onAddFolder: () => void;
  onDeleteFolder: (id: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  noteCount: number;
  favoriteCount: number;
};

export function Sidebar({
  notes,
  selectedId,
  folders,
  tags,
  view,
  onView,
  onSelectNote,
  onAddSubNote,
  onAddFolder,
  onDeleteFolder,
  theme,
  onToggleTheme,
  noteCount,
  favoriteCount,
}: Props) {
  // Build children index
  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Note[]>();
    for (const n of notes) {
      const k = n.parentId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }
    return m;
  }, [notes]);

  const roots = childrenOf.get(null) ?? [];
  const hasNested = roots.some((r) => (childrenOf.get(r.id)?.length ?? 0) > 0);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-hairline bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LinkIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </div>
          <span className="font-display text-lg tracking-tight">Quill</span>
        </div>
        <button
          onClick={onToggleTheme}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        <Section>
          <Item
            icon={<Inbox className="h-4 w-4" />}
            label="All notes"
            count={noteCount}
            active={view.kind === "all"}
            onClick={() => onView({ kind: "all" })}
          />
          <Item
            icon={<Star className="h-4 w-4" />}
            label="Favorites"
            count={favoriteCount}
            active={view.kind === "favorites"}
            onClick={() => onView({ kind: "favorites" })}
          />
        </Section>

        {hasNested && (
          <>
            <SectionHeader title="Hierarchy" />
            <Section>
              {roots.map((n) => (
                <NoteTreeItem
                  key={n.id}
                  note={n}
                  depth={0}
                  childrenOf={childrenOf}
                  selectedId={selectedId}
                  onSelectNote={onSelectNote}
                  onAddSubNote={onAddSubNote}
                />
              ))}
            </Section>
          </>
        )}

        <SectionHeader title="Folders" action={onAddFolder} />
        <Section>
          {folders.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">No folders yet</p>
          )}
          {folders.map((f) => (
            <Item
              key={f.id}
              icon={
                f.emoji ? (
                  <span className="text-sm leading-none">{f.emoji}</span>
                ) : (
                  <FolderIcon className="h-4 w-4" />
                )
              }
              label={f.name}
              active={view.kind === "folder" && view.id === f.id}
              onClick={() => onView({ kind: "folder", id: f.id })}
              onDelete={() => onDeleteFolder(f.id)}
            />
          ))}
        </Section>

        {tags.length > 0 && (
          <>
            <SectionHeader title="Tags" />
            <Section>
              {tags.map((t) => (
                <Item
                  key={t}
                  icon={<Hash className="h-4 w-4" />}
                  label={t}
                  active={view.kind === "tag" && view.name === t}
                  onClick={() => onView({ kind: "tag", name: t })}
                />
              ))}
            </Section>
          </>
        )}
      </nav>

      <div className="border-t border-hairline px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        Local · Synced to this browser
      </div>
    </aside>
  );
}

function NoteTreeItem({
  note,
  depth,
  childrenOf,
  selectedId,
  onSelectNote,
  onAddSubNote,
}: {
  note: Note;
  depth: number;
  childrenOf: Map<string | null, Note[]>;
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onAddSubNote: (parentId: string) => void;
}) {
  const kids = childrenOf.get(note.id) ?? [];
  const hasKids = kids.length > 0;
  const [open, setOpen] = useState(true);
  const active = selectedId === note.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm transition-colors cursor-pointer",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelectNote(note.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasKids) setOpen((v) => !v);
          }}
          className={cn(
            "flex h-4 w-4 items-center justify-center text-muted-foreground transition-transform",
            open && "rotate-90",
            !hasKids && "opacity-0 pointer-events-none",
          )}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 truncate">{note.title || "Untitled"}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSubNote(note.id);
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-foreground"
          aria-label="Add sub-note"
          title="Add sub-note"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {open &&
        hasKids &&
        kids.map((k) => (
          <NoteTreeItem
            key={k.id}
            note={k}
            depth={depth + 1}
            childrenOf={childrenOf}
            selectedId={selectedId}
            onSelectNote={onSelectNote}
            onAddSubNote={onAddSubNote}
          />
        ))}
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 flex flex-col gap-0.5">{children}</div>;
}

function SectionHeader({ title, action }: { title: string; action?: () => void }) {
  return (
    <div className="mt-4 mb-1 flex items-center justify-between px-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {action && (
        <button
          onClick={action}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label={`Add ${title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Item({
  icon,
  label,
  count,
  active,
  onClick,
  onDelete,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
      onClick={onClick}
    >
      <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${label}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
