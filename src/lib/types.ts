export type Note = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  parentId: string | null;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Folder = {
  id: string;
  name: string;
  emoji?: string;
  createdAt: number;
};

export type View =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "folder"; id: string }
  | { kind: "tag"; name: string };
