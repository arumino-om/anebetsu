import { PluginConfig } from "@/components/plugins-config";

// デフォルトで登録しておくプラグイン（ビルド済み）
export const DEFAULT_PLUGINS: PluginConfig[] = [
  {
    id: "text-viewer-v1",
    url: "/wasm/text-viewer.js", // publicフォルダのパス
    entryFunction: "createTextViewerPlugin", // C++の EXPORT_NAME
  },
];

//TODO: 将来的にユーザー設定可能にする
export const EXTENSION_MAP: Record<string, string> = {
  txt: "text-viewer-v1",
  md: "text-viewer-v1",
  json: "text-viewer-v1",
  js: "text-viewer-v1",
  ts: "text-viewer-v1",
  tsx: "text-viewer-v1",
  cpp: "text-viewer-v1",
  hpp: "text-viewer-v1",
  log: "text-viewer-v1",
  csv: "text-viewer-v1",
};

export const findPluginIdForFile = (fileName: string): string | null => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  return EXTENSION_MAP[ext] || null;
};

export const isWorkerRequired = (file: File): boolean => {
  if (file.type.startsWith("image/")) {
    return false;
  }

  const pluginId = findPluginIdForFile(file.name);

  return pluginId !== null;
};