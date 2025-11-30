export interface WasmModule {
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
