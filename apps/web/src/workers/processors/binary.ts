import { WasmModule } from "../types";

export async function process_binary(
  wasmModule: WasmModule,
  file: File,
): Promise<string> {
  if (!wasmModule.process_binary) {
    throw new Error("Wasm module does not have 'process_binary' function.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const fileSize = arrayBuffer.byteLength;
  const uint8Array = new Uint8Array(arrayBuffer);

  // バイナリデータを直接Wasmメモリにコピーして処理する
  const ptr = wasmModule._malloc(fileSize);

  try {
    wasmModule.HEAPU8.set(uint8Array, ptr);

    return wasmModule.process_binary(ptr, fileSize);
  } finally {
    wasmModule._free(ptr);
  }
}
