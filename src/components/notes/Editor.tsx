import { useEffect, useRef, useState } from "react";
import { Pin, Star, Trash2, Hash, Folder as FolderIcon, Type } from "lucide-react";
import type { Folder, Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RichEditor, type RichEditorHandle } from "@/components/notes/RichEditor";

type Props = {
  note: Note | null;
  folders: Folder[];
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
};

export function Editor({
  note,
  folders,
  onChange,
  onDelete,
  onTogglePin,
  onToggleFavorite,
}: Props) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<RichEditorHandle>(null);
  const [showFormat, setShowFormat] = useState(false);
  // Force re-render once the editor mounts so we can read its toolbar handle
  const [, setEditorReady] = useState(0);

  useEffect(() => {
    autosize(titleRef.current);
  }, [note?.id, note?.title]);

  useEffect(() => {
    // Editor instance is created after first render; trigger one update
    if (editorRef.current?.toolbar) return;
    const t = setTimeout(() => setEditorReady((v) => v + 1), 0);
    return () => clearTimeout(t);
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-hairline" />
          <p className="font-display text-lg text-muted-foreground">
            Select a note or create a new one
          </p>
        </div>
      </div>
    );
  }

  const folder = folders.find((f) => f.id === note.folderId) ?? null;
  const tagsText = note.tags.join(", ");

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-hairline px-6 py-3 sm:px-10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FolderIcon className="h-3.5 w-3.5" />
          <select
            value={note.folderId ?? ""}
            onChange={(e) =>
              onChange({ folderId: e.target.value === "" ? null : e.target.value })
            }
            className="bg-transparent text-xs text-foreground/80 focus:outline-none cursor-pointer"
          >
            <option value="">Unfiled</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji ? `${f.emoji} ` : ""}
                {f.name}
              </option>
            ))}
          </select>
          {folder && <span className="opacity-50">·</span>}
          <span>{new Date(note.updatedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => setShowFormat((v) => !v)}
            active={showFormat}
            label="Format"
          >
            <Type className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={onTogglePin}
            active={note.pinned}
            label="Pin"
          >
            <Pin className={cn("h-4 w-4", note.pinned && "fill-current")} />
          </IconButton>
          <IconButton
            onClick={onToggleFavorite}
            active={note.favorite}
            label="Favorite"
          >
            <Star className={cn("h-4 w-4", note.favorite && "fill-current")} />
          </IconButton>
          <IconButton onClick={onDelete} label="Delete" danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Formatting toolbar — collapsible, sits directly below the action bar */}
      {showFormat && (
        <div className="border-b border-hairline bg-background/95 backdrop-blur">
          {editorRef.current?.toolbar}
        </div>
      )}

      {/* Body */}
      <div className="thin-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
          <textarea
            ref={titleRef}
            value={note.title}
            onChange={(e) => {
              onChange({ title: e.target.value });
              autosize(e.currentTarget);
            }}
            placeholder="Untitled"
            rows={1}
            className="w-full resize-none bg-transparent font-display text-4xl font-medium tracking-tight placeholder:text-muted-foreground/50 focus:outline-none"
          />

          <div className="mt-3 flex items-center gap-2 text-xs">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={tagsText}
              onChange={(e) =>
                onChange({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim().replace(/^#/, ""))
                    .filter(Boolean),
                })
              }
              placeholder="Add tags, comma separated"
              className="flex-1 bg-transparent text-muted-foreground placeholder:text-muted-foreground/60 focus:text-foreground focus:outline-none"
            />
          </div>

          <div className="mt-6">
            <RichEditor
              key={note.id}
              value={note.content}
              onChange={(html) => onChange({ content: html })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  active,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        danger && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
