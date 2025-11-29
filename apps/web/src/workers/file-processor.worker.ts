import type {
  AnebetsuPluginResult,
  AnebetsuWorkerMessage,
  Plugin,
} from "../types/plugin";

interface WasmModule {
  // memory allocation helpers exposed by Emscripten/wasm build
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;

  // plugin entry points (one of these is expected)
  process_binary?: (ptr: number, size: number) => string;
  process?: (text: string) => string;
  process_file?: (path: string) => string;

  // Emscripten FS and WORKERFS for file mounting
  FS: {
    mkdir: (path: string) => void;
    mount: (type: unknown, opts: unknown, mountPoint: string) => void;
  };
  WORKERFS: unknown;

  // allow other properties to be present
  [key: string]: unknown;
}

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
  const wasmModule = moduleCache.get(plugin.id) as WasmModule;

  const arrayBuffer = await file.arrayBuffer();
  const fileSize = arrayBuffer.byteLength;
  const uint8Array = new Uint8Array(arrayBuffer);
  let jsonResult;

  if (wasmModule.process_file) {
    const mountDir = `/work-${Date.now()}`; // 被らないようにユニークな名前で

    try {
      wasmModule.FS.mkdir(mountDir);
    } catch (e) {
      /* すでにあったら無視 */
    }

    wasmModule.FS.mount(
      wasmModule.WORKERFS,
      {
        files: [file],
      },
      mountDir,
    );

    const filePath = `${mountDir}/${file.name}`;

    jsonResult = wasmModule.process_file(filePath);
  } else if (wasmModule.process_binary) {
    // Wasmメモリを確保 (malloc)
    const ptr = wasmModule._malloc(fileSize);

    try {
      // 確保したメモリにファイルデータを書き込む
      wasmModule.HEAPU8.set(uint8Array, ptr);

      // C++関数を実行 (ポインタとサイズを渡す)
      jsonResult = wasmModule.process_binary(ptr, fileSize);
    } finally {
      // 【重要】使い終わったメモリは必ず解放する
      wasmModule._free(ptr);
    }
  } else if (wasmModule.process) {
    const textData = new TextDecoder().decode(uint8Array);

    jsonResult = wasmModule.process(textData);
  } else {
    throw new Error(
      "Plugin does not have 'process' or 'process_binary' function.",
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
