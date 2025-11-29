// プラグイン設定の型定義
export interface PluginConfig {
  id: string;
  url: string;
  entryFunction: string;
}

export interface PluginItemProps {
  plugin: PluginConfig;
  onChange: (
    id: string,
    field: keyof Omit<PluginConfig, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
}

export interface PluginsConfigPanelProps {
  onSave?: (plugins: PluginConfig[]) => void;
}

const STORAGE_KEY = "anebetsu_plugins_config";

// localStorage からプラグイン設定を読み込む
export function loadPluginsConfig(): PluginConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored) as PluginConfig[];
    }
  } catch {
    // パースエラー時は空配列を返す
  }

  return [];
}

// localStorage にプラグイン設定を保存する
export function savePluginsConfig(plugins: PluginConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
}

// ユニークIDを生成
export function generateId(): string {
  return `plugin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// コンポーネントの再エクスポート
export { default as PluginItem } from "./item";
export { default as PluginsConfigPanel } from "./panel";
export { default as PluginsConfigModal } from "./modal";
