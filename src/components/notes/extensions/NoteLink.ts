import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Inline mark used for cross-note links.
 * Renders as <a data-note-link="<id>" href="#note:<id>">title</a>
 */
export const NoteLink = Mark.create({
  name: "noteLink",
  inclusive: false,
  exitable: true,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-note-link"),
        renderHTML: (attrs) => {
          if (!attrs.noteId) return {};
          return {
            "data-note-link": attrs.noteId,
            href: `#note:${attrs.noteId}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-note-link]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        class: "note-link",
      }),
      0,
    ];
  },
});
