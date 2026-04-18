import { useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

/* ------- Underline (lightweight, avoids extra package) ------- */
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

/* ------- Component ------- */

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
};

export function RichEditor({ value, onChange }: Props) {
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
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose-note focus:outline-none min-h-[60vh] text-[15px] leading-7 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_input]:mt-1.5",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (note switch)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="mt-4" />
    </div>
  );
}

/* ------- Toolbar ------- */

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const currentFont =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? "";
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";
  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) ?? "";

  return (
    <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-1 border-b border-hairline bg-background/95 px-1 py-2 backdrop-blur">
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
