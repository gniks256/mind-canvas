import { createFileRoute } from "@tanstack/react-router";
import { NotesApp } from "@/components/notes/NotesApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — A quiet place for notes" },
      {
        name: "description",
        content:
          "Minimalist notes app inspired by Apple and Notion. Folders, tags, favorites — private and instant in your browser.",
      },
      { property: "og:title", content: "Quill — A quiet place for notes" },
      {
        property: "og:description",
        content:
          "Minimalist notes app inspired by Apple and Notion. Private, offline, beautiful.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <NotesApp />;
}
