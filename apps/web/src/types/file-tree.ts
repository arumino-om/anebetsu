export type FileNode = {
  name: string;
  type: "file" | "directory";
  size?: number; // バイト数
  children?: FileNode[]; // ディレクトリの場合のみ存在
};
