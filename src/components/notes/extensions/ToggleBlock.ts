import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Notion-style toggle block.
 *
 * Structure:
 *   <details data-toggle open?>
 *     <summary>summary text</summary>
 *     <div>...children blocks...</div>
 *   </details>
 *
 * We model it as two child nodes to keep editing predictable:
 *   toggleBlock > [toggleSummary, toggleContent]
 */

export const ToggleBlock = Node.create({
  name: "toggleBlock",
  group: "block",
  content: "toggleSummary toggleContent",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.hasAttribute("open"),
        renderHTML: (attrs) => (attrs.open ? { open: "" } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "details[data-toggle]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, { "data-toggle": "true", class: "note-toggle" }),
      0,
    ];
  },

  addCommands() {
    return {
      insertToggle:
        () =>
        ({ chain }: { chain: () => ReturnType<import("@tiptap/core").Editor["chain"]> }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "Toggle" }],
                },
                {
                  type: "toggleContent",
                  content: [{ type: "paragraph" }],
                },
              ],
            })
            .run(),
    } as never;
  },
});

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes, { class: "note-toggle-summary" }), 0];
  },
});

export const ToggleContent = Node.create({
  name: "toggleContent",
  content: "block+",

  parseHTML() {
    return [{ tag: "div[data-toggle-content]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-toggle-content": "true",
        class: "note-toggle-content",
      }),
      0,
    ];
  },
});
