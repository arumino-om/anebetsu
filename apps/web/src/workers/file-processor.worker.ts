import type {
  AnebetsuPluginResult,
  AnebetsuWorkerMessage,
  Plugin,
} from "../types/plugin";

// 一度読み込んだプラグインはMapで保持する
const moduleCache = new Map<string, unknown>();

async function loadPlugins(plugin: Plugin): Promise<void> {
  importScripts(plugin.url);

  // グローバルからエントリ関数を探す
  const factoryFunc = (self as unknown as Record<string, unknown>)[
    plugin.entryFunction
  ] as ((options: unknown) => Promise<unknown>) | undefined;

  if (typeof factoryFunc !== "function") {
    throw new Error(
      `Entry function "${plugin.entryFunction}" not found in global scope. Check EXPORT_NAME.`,
    );
  }

  // Wasmインスタンス化
  const moduleInstance = await factoryFunc({
    locateFile: (path: string) => {
      const baseUrl = plugin.url.substring(0, plugin.url.lastIndexOf("/") + 1);

      return baseUrl + path;
    },
  });

  moduleCache.set(plugin.id, moduleInstance);
}

async function runPlugin(
  plugin: Plugin,
  file: File,
): Promise<AnebetsuPluginResult> {
  const wasmModule = moduleCache.get(plugin.id) as Record<string, unknown>;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  //TODO: バイナリデータをそのまま渡す方法があればそちらに変更する
  const dataString = new TextDecoder().decode(uint8Array);

  if (typeof wasmModule.process !== "function") {
    throw new Error("Plugin does not have a 'process' function.");
  }

  const jsonResult = wasmModule.process(dataString) as string;
  const result = JSON.parse(jsonResult);

  return result;
}

self.onmessage = async (e: MessageEvent) => {
  const { file, plugin }: { file: File; plugin: Plugin } = e.data;

  if (!plugin) {
    self.postMessage({
      type: "ERROR",
      payload: "No plugin configuration provided",
    });

    return;
  }

  try {
    if (!moduleCache.has(plugin.id)) {
      await loadPlugins(plugin);
    }

    const result = await runPlugin(plugin, file);

    if (result.type === "error") {
      self.postMessage({
        type: "ERROR",
        payload: result.payload.message,
      } as AnebetsuWorkerMessage);
    } else {
      self.postMessage({
        type: "RESULT",
        payload: result,
      } as AnebetsuWorkerMessage);
    }
  } catch (err: unknown) {
    self.postMessage({
      type: "ERROR",
      payload: String(err),
    } as AnebetsuWorkerMessage);
  }
};

// Worker 準備完了を通知
self.postMessage({ type: "READY", payload: null } as AnebetsuWorkerMessage);
