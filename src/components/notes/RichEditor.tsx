import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Link2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";
import { NoteLink } from "@/components/notes/extensions/NoteLink";
import { ToggleBlock, ToggleSummary, ToggleContent } from "@/components/notes/extensions/ToggleBlock";
import { NoteSearchPopup } from "@/components/notes/NoteSearchPopup";

/* ------- FontSize extension (TextStyle-based) ------- */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]/g, "") || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: { chain: () => ReturnType<TiptapEditor["chain"]> }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => ReturnType<TiptapEditor["chain"]> }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as never;
  },
});

/* ------- Underline (lightweight) ------- */
const Underline = Extension.create({
  name: "underline",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          underline: {
            default: null,
            parseHTML: (el) => (el.style.textDecoration?.includes("underline") ? true : null),
            renderHTML: (attrs) =>
              attrs.underline ? { style: "text-decoration: underline" } : {},
          },
        },
      },
    ];
  },
});

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Sans", value: "Inter, system-ui, sans-serif" },
  { label: "Serif", value: "Fraunces, Georgia, serif" },
  { label: "Mono", value: "JetBrains Mono, ui-monospace, monospace" },
];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
const COLORS = [
  "var(--foreground)",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  showToolbar?: boolean;
  notes: Note[];
  currentNoteId: string;
  onJumpNote: (id: string) => void;
};

export type RichEditorHandle = {
  toolbar: React.ReactNode;
};

export const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { value, onChange, showToolbar = true, notes, currentNoteId, onJumpNote },
  ref,
) {
  // Popup state for @-mention or toolbar link button
  const [popup, setPopup] = useState<{
    x: number;
    y: number;
    initialQuery: string;
    /** range to replace when picking (used for @-trigger) */
    replaceRange?: { from: number; to: number };
  } | null>(null);

  // Use refs for the latest notes/title so the editor click handler always sees fresh data.
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const onJumpRef = useRef(onJumpNote);
  onJumpRef.current = onJumpNote;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ["textStyle"] }),
      FontSize,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      NoteLink,
      ToggleBlock,
      ToggleSummary,
      ToggleContent,
      Placeholder.configure({ placeholder: "Start writing… type @ to link a note" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose-note focus:outline-none min-h-[60vh] text-[15px] leading-7 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_input]:mt-1.5",
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement;
        const link = target.closest("a[data-note-link]") as HTMLAnchorElement | null;
        if (link) {
          event.preventDefault();
          const id = link.getAttribute("data-note-link");
          if (id) onJumpRef.current(id);
          return true;
        }
        return false;
      },
      handleKeyDown(view, event) {
        // Open @-popup
        if (event.key === "@") {
          // Defer: open popup right after the @ is inserted
          setTimeout(() => {
            const { from } = view.state.selection;
            const coords = view.coordsAtPos(from);
            setPopup({
              x: coords.left,
              y: coords.bottom + 4,
              initialQuery: "",
              replaceRange: { from: from, to: from + 1 }, // will adjust below
            });
          }, 0);
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (note switch)
  useEffect(() => {
    if (!editor || !popup) return;
    const handler = () => {
      // Find the most recent @ before cursor; if absent, close popup.
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 60), from, "\n", "\0");
      const m = text.match(/@([^\s@]*)$/);
      if (!m) {
        setPopup(null);
        return;
      }
      const query = m[1];
      const triggerFrom = from - m[0].length; // position of '@'
      setPopup((p) => (p ? { ...p, initialQuery: query, replaceRange: { from: triggerFrom, to: from } } : p));
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, popup]);

  // Sync external value
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const insertNoteLink = useCallback(
    (note: Note) => {
      if (!editor) return;
      const range = popup?.replaceRange;
      const title = note.title || "Untitled";
      const chain = editor.chain().focus();
      if (range) {
        chain.deleteRange(range);
      }
      chain
        .insertContent([
          {
            type: "text",
            text: title,
            marks: [{ type: "noteLink", attrs: { noteId: note.id } }],
          },
          { type: "text", text: " " },
        ])
        .run();
      setPopup(null);
    },
    [editor, popup],
  );

  const openLinkPickerFromButton = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setPopup({ x: coords.left, y: coords.bottom + 4, initialQuery: "" });
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      toolbar: editor ? (
        <Toolbar editor={editor} onLinkNote={openLinkPickerFromButton} />
      ) : null,
    }),
    [editor, openLinkPickerFromButton],
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      {showToolbar && <Toolbar editor={editor} onLinkNote={openLinkPickerFromButton} />}
      <EditorContent editor={editor} className={showToolbar ? "mt-4" : ""} />
      {popup && (
        <NoteSearchPopup
          notes={notesRef.current}
          excludeId={currentNoteId}
          anchor={{ x: popup.x, y: popup.y }}
          initialQuery={popup.initialQuery}
          onPick={insertNoteLink}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
});

/* ------- Toolbar ------- */

function Toolbar({
  editor,
  onLinkNote,
}: {
  editor: TiptapEditor;
  onLinkNote: () => void;
}) {
  const currentFont =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? "";
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";
  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-1 px-6 py-2 sm:px-10">
      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={!!editor.getAttributes("textStyle").underline}
        onClick={() => {
          const on = !!editor.getAttributes("textStyle").underline;
          editor
            .chain()
            .focus()
            .setMark("textStyle", { underline: on ? null : true })
            .run();
        }}
        label="Underline"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleList("taskList", "taskItem").run()}
        label="Checklist"
      >
        <ListChecks className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("toggleBlock")}
        onClick={() =>
          (editor.chain().focus() as never as { insertToggle: () => { run: () => void } })
            .insertToggle()
            .run()
        }
        label="Toggle block"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={onLinkNote} label="Link to note">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      <select
        value={currentFont}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) editor.chain().focus().unsetFontFamily().run();
          else editor.chain().focus().setFontFamily(v).run();
        }}
        className="h-7 rounded-md border border-hairline bg-transparent px-1.5 text-xs focus:outline-none"
        title="Font"
      >
        <option value="">Font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        value={currentSize}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) (editor.chain().focus() as never as { unsetFontSize: () => { run: () => void } }).unsetFontSize().run();
          else
            (editor.chain().focus() as never as { setFontSize: (s: string) => { run: () => void } })
              .setFontSize(v)
              .run();
        }}
        className="h-7 rounded-md border border-hairline bg-transparent px-1.5 text-xs focus:outline-none"
        title="Size"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s.replace("px", "")}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-0.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => editor.chain().focus().setColor(c).run()}
            className={cn(
              "h-5 w-5 rounded-full border border-hairline transition-transform hover:scale-110",
              currentColor === c && "ring-2 ring-ring ring-offset-1 ring-offset-background",
            )}
            style={{ background: c }}
            aria-label={`Color ${c}`}
            title={c}
          />
        ))}
        <button
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="ml-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          title="Reset color"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-hairline" />;
}

function ToolbarBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
