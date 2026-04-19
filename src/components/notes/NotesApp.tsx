import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/notes/Sidebar";
import { NoteList } from "@/components/notes/NoteList";
import { Editor } from "@/components/notes/Editor";
import { useLocalStorage, uid } from "@/lib/storage";
import { useTheme } from "@/lib/theme";
import type { Folder, Note, View } from "@/lib/types";

const seedNotes = (): Note[] => {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "Welcome to Quill",
      content:
        "<p>A quiet place for your thoughts.</p><ul><li>Press the <strong>+</strong> button to create a note</li><li>Use the toolbar to format text, add lists or checklists</li><li>Pin important notes to the top</li><li>Star favorites for quick access</li></ul><p>Type <strong>@</strong> to link another note. Add sub-notes from the sidebar.</p>",
      folderId: null,
      parentId: null,
      tags: ["welcome"],
      pinned: true,
      favorite: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export function NotesApp() {
  const { theme, toggle } = useTheme();
  // v2 keys — schema changed from plain text to rich HTML
  const [notes, setNotes] = useLocalStorage<Note[]>("quill.notes.v3", seedNotes());
  const [folders, setFolders] = useLocalStorage<Folder[]>("quill.folders.v2", []);
  const [view, setView] = useState<View>({ kind: "all" });
  const [selectedId, setSelectedId] = useLocalStorage<string | null>(
    "quill.selectedId.v2",
    null,
  );
  const [query, setQuery] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"sidebar" | "list" | "editor">(
    "list",
  );

  // Tags derived from notes
  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  // Filter & sort
  const visibleNotes = useMemo(() => {
    let arr = [...notes];
    if (view.kind === "favorites") arr = arr.filter((n) => n.favorite);
    else if (view.kind === "folder") arr = arr.filter((n) => n.folderId === view.id);
    else if (view.kind === "tag") arr = arr.filter((n) => n.tags.includes(view.name));

    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    arr.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return arr;
  }, [notes, view, query]);

  // Maintain selection
  useEffect(() => {
    if (selectedId && visibleNotes.some((n) => n.id === selectedId)) return;
    setSelectedId(visibleNotes[0]?.id ?? null);
  }, [visibleNotes, selectedId, setSelectedId]);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  // Title for the list panel
  const listTitle = (() => {
    if (view.kind === "all") return "All Notes";
    if (view.kind === "favorites") return "Favorites";
    if (view.kind === "folder")
      return folders.find((f) => f.id === view.id)?.name ?? "Folder";
    if (view.kind === "tag") return `#${view.name}`;
    return "Notes";
  })();

  // Operations
  const createNote = (parentId: string | null = null) => {
    const parent = parentId ? notes.find((n) => n.id === parentId) ?? null : null;
    const n: Note = {
      id: uid(),
      title: "",
      content: "",
      folderId: parent
        ? parent.folderId
        : view.kind === "folder"
          ? view.id
          : null,
      parentId,
      tags: view.kind === "tag" ? [view.name] : [],
      pinned: false,
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([n, ...notes]);
    setSelectedId(n.id);
    setMobilePanel("editor");
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const addFolder = () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const emoji = window.prompt("Emoji (optional)") || undefined;
    const f: Folder = {
      id: uid(),
      name: name.trim(),
      emoji: emoji?.trim() || undefined,
      createdAt: Date.now(),
    };
    setFolders([...folders, f]);
    setView({ kind: "folder", id: f.id });
  };

  const deleteFolder = (id: string) => {
    if (!window.confirm("Delete this folder? Notes will be unfiled.")) return;
    setFolders(folders.filter((f) => f.id !== id));
    setNotes(notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)));
    if (view.kind === "folder" && view.id === id) setView({ kind: "all" });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-hairline bg-background/80 px-4 py-2 backdrop-blur md:hidden">
        <button
          onClick={() =>
            setMobilePanel((p) => (p === "sidebar" ? "list" : "sidebar"))
          }
          aria-label="Toggle menu"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          {mobilePanel === "sidebar" ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
        <span className="font-display text-sm tracking-tight">
          {selectedNote?.title || listTitle}
        </span>
        <button
          onClick={() => createNote()}
          className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground"
        >
          New
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          mobilePanel === "sidebar" ? "flex" : "hidden"
        } absolute inset-0 top-10 z-20 md:static md:top-0 md:flex`}
      >
        <Sidebar
          notes={notes}
          selectedId={selectedId}
          folders={folders}
          tags={tags}
          view={view}
          onView={(v) => {
            setView(v);
            setMobilePanel("list");
          }}
          onSelectNote={(id) => {
            setSelectedId(id);
            setView({ kind: "all" });
            setMobilePanel("editor");
          }}
          onAddSubNote={(parentId) => createNote(parentId)}
          onAddFolder={addFolder}
          onDeleteFolder={deleteFolder}
          theme={theme}
          onToggleTheme={toggle}
          noteCount={notes.length}
          favoriteCount={notes.filter((n) => n.favorite).length}
        />
      </div>

      {/* Note list */}
      <div
        className={`${
          mobilePanel === "list" ? "flex" : "hidden"
        } w-full pt-10 md:static md:flex md:w-auto md:pt-0`}
      >
        <NoteList
          notes={visibleNotes}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMobilePanel("editor");
          }}
          query={query}
          onQuery={setQuery}
          onCreate={() => createNote()}
          title={listTitle}
        />
      </div>

      {/* Editor */}
      <div
        className={`${
          mobilePanel === "editor" ? "flex" : "hidden"
        } w-full flex-1 pt-10 md:static md:flex md:pt-0`}
      >
        <Editor
          note={selectedNote}
          folders={folders}
          notes={notes}
          onJumpNote={(id) => {
            setSelectedId(id);
            setView({ kind: "all" });
            setMobilePanel("editor");
          }}
          onChange={(patch) => selectedNote && updateNote(selectedNote.id, patch)}
          onDelete={() => {
            if (!selectedNote) return;
            if (!window.confirm("Delete this note?")) return;
            deleteNote(selectedNote.id);
            setMobilePanel("list");
          }}
          onTogglePin={() =>
            selectedNote &&
            updateNote(selectedNote.id, { pinned: !selectedNote.pinned })
          }
          onToggleFavorite={() =>
            selectedNote &&
            updateNote(selectedNote.id, { favorite: !selectedNote.favorite })
          }
        />
      </div>
    </div>
  );
}
