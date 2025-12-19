import type {
  AnebetsuPluginResult,
  AnebetsuWorkerMessage,
  Plugin,
} from "../types/plugin";
import type { WasmModule } from "../types/workers";

import { process_binary } from "./processors/binary";
import { process_file } from "./processors/file";
import { process_text } from "./processors/text";

// 一度読み込んだプラグインはMapで保持する
const moduleCache = new Map<string, unknown>();

async function loadPlugins(plugin: Plugin): Promise<void> {
  // ES Module Workerでは importScripts() が使えないため、
  // fetchでスクリプトを取得し、スクリプトをBlobとして動的importする
  const response = await fetch(plugin.url);
  const scriptText = await response.text();

  // Emscriptenが生成するコードは `var XXX = (()=>{...})();` という形式で
  // グローバル変数に代入する。これをES Module形式に変換してexportする
  const wrappedScript = `${scriptText}\nexport default ${plugin.entryFunction};`;
  const blob = new Blob([wrappedScript], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ blobUrl);
    const factoryFunc = module.default as (
      options: unknown,
    ) => Promise<unknown>;

    if (typeof factoryFunc !== "function") {
      throw new Error(
        `Entry function "${plugin.entryFunction}" not found. Check EXPORT_NAME.`,
      );
    }

    // Wasmインスタンス化
    const moduleInstance = await factoryFunc({
      locateFile: (path: string) => {
        const baseUrl = plugin.url.substring(
          0,
          plugin.url.lastIndexOf("/") + 1,
        );

        return baseUrl + path;
      },
    });

    moduleCache.set(plugin.id, moduleInstance);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function runPlugin(
  plugin: Plugin,
  file: File,
): Promise<AnebetsuPluginResult> {
  const wasmModule = moduleCache.get(plugin.id) as WasmModule;
  let jsonResult;

  if (wasmModule.process_file) {
    jsonResult = await process_file(wasmModule, file);
  } else if (wasmModule.process_binary) {
    jsonResult = await process_binary(wasmModule, file);
  } else if (wasmModule.process) {
    jsonResult = await process_text(wasmModule, file);
  } else {
    throw new Error(
      "Plugin does not have 'process', 'process_binary', or 'process_file' function.",
    );
  }
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
