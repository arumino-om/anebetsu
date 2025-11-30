import { WasmModule } from "../types";

export async function process_text(
  wasmModule: WasmModule,
  file: File,
): Promise<string> {
  if (!wasmModule.process) {
    throw new Error("Wasm module does not have 'process' function.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // テキストデータとして処理する
  const textData = new TextDecoder().decode(uint8Array);

  return wasmModule.process(textData);
}
