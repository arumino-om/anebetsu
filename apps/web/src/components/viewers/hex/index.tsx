import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useEffect, useState } from "react";

const BYTES_PER_ROW = 16;

export const HexViewer = ({ file }: { file: File }) => {
  const [buffer, setBuffer] = useState<Uint8Array | null>(null);

  useEffect(() => {
    // ファイル読み込み
    // ※今回はシンプルに全読み込みしていますが、GB級のファイルに対応する場合は
    //   file.slice() を使ってスクロール位置に合わせて部分読み込みする設計にします
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        setBuffer(new Uint8Array(e.target.result as ArrayBuffer));
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  // 行数を計算
  const rowCount = buffer ? Math.ceil(buffer.length / BYTES_PER_ROW) : 0;

  // 1行分の描画コンポーネント
  const Row = ({ index, style }: ListChildComponentProps) => {
    if (!buffer) return null;

    const start = index * BYTES_PER_ROW;
    const end = Math.min(start + BYTES_PER_ROW, buffer.length);
    const chunk = buffer.subarray(start, end);

    // アドレス (例: 00000010)
    const address = start.toString(16).toUpperCase().padStart(8, "0");

    // Hex表示 (例: 4A 6F ...)
    const hexParts = [];

    for (let i = 0; i < BYTES_PER_ROW; i++) {
      if (i < chunk.length) {
        hexParts.push(chunk[i].toString(16).toUpperCase().padStart(2, "0"));
      } else {
        hexParts.push("  "); // 空白埋め
      }
    }
    const hex = hexParts.join(" ");

    // ASCII表示 (制御文字はドットにする)
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");

    return (
      <div
        className="flex font-mono text-sm border-b border-gray-100 hover:bg-blue-50 items-center px-4 bg-white text-gray-700"
        style={style}
      >
        {/* Offset */}
        <span className="text-gray-400 select-none mr-4 w-20 flex-shrink-0">
          {address}
        </span>

        {/* Hex Data */}
        <span className="mr-4 w-[24rem] flex-shrink-0 whitespace-pre">
          {hex}
        </span>

        {/* ASCII Data */}
        <span className="text-blue-600 opacity-80 border-l border-gray-200 pl-4 truncate">
          {ascii}
        </span>
      </div>
    );
  };

  if (!buffer) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Reading binary data...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={rowCount}
            itemSize={28} // 1行の高さ(px)
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};
