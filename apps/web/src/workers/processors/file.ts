import { WasmModule } from "../types";

export async function process_file(
  wasmModule: WasmModule,
  file: File,
): Promise<string> {
  if (!wasmModule.process_file) {
    throw new Error("Wasm module does not have 'process_file' function.");
  }

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

  return wasmModule.process_file(filePath);
}
