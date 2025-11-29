import { FixedSizeList as List, ListOnItemsRenderedProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useEffect, useState, useCallback } from "react";

const BYTES_PER_ROW = 16;
const CHUNK_SIZE = 1024 * 64; // 64KB単位で読み込む

export const HexViewer = ({ file }: { file: File }) => {
  // 読み込んだデータ（チャンク）を保持するマップ
  // Key: チャンク番号, Value: データ
  const [loadedChunks, setLoadedChunks] = useState<Map<number, Uint8Array>>(
    new Map(),
  );

  // ファイルが変わったらキャッシュをクリア
  useEffect(() => {
    setLoadedChunks(new Map());
  }, [file]);

  // 行数を計算 (ファイルサイズ / 16)
  const rowCount = Math.ceil(file.size / BYTES_PER_ROW);

  // 必要なデータを読み込む関数
  const loadRange = useCallback(
    async (startRow: number, endRow: number) => {
      const startByte = startRow * BYTES_PER_ROW;
      const endByte = endRow * BYTES_PER_ROW;

      // 必要なチャンクの範囲を計算
      const startChunkIndex = Math.floor(startByte / CHUNK_SIZE);
      const endChunkIndex = Math.floor(endByte / CHUNK_SIZE);

      const newChunks = new Map<number, Uint8Array>();
      let hasNewData = false;

      // 足りないチャンクだけをロード
      for (let i = startChunkIndex; i <= endChunkIndex; i++) {
        const chunkStart = i * CHUNK_SIZE;
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, file.size);

        // File.slice() はメモリを使わず、単に「参照」を作るだけなので軽量
        const blob = file.slice(chunkStart, chunkEnd);
        const buffer = await blob.arrayBuffer();

        newChunks.set(i, new Uint8Array(buffer));
        hasNewData = true;
      }

      if (hasNewData) {
        setLoadedChunks((prev) => {
          const next = new Map(prev);

          newChunks.forEach((val, key) => next.set(key, val));

          //TODO: 古すぎるチャンクを消す処理を入れる
          return next;
        });
      }
    },
    [file],
  );

  // スクロールイベントハンドラ
  const onItemsRendered = ({
    visibleStartIndex,
    visibleStopIndex,
  }: ListOnItemsRenderedProps) => {
    // 見えている範囲 + 前後少し(バッファ)を読み込む
    const bufferRows = 60;
    const start = Math.max(0, visibleStartIndex - bufferRows);
    const end = Math.min(rowCount, visibleStopIndex + bufferRows);

    loadRange(start, end);
  };

  // 行描画コンポーネント
  // dataには loadedChunks が渡ってくる
  const Row = ({ index, style, data }: any) => {
    const chunks = data as Map<number, Uint8Array>;

    const globalOffset = index * BYTES_PER_ROW;
    const chunkIndex = Math.floor(globalOffset / CHUNK_SIZE);
    const localOffset = globalOffset % CHUNK_SIZE;

    const chunk = chunks.get(chunkIndex);

    // データがまだロードされていない場合
    if (!chunk) {
      return (
        <div
          className="flex items-center px-4 text-gray-300 text-sm font-mono border-b border-gray-50"
          style={style}
        >
          {globalOffset.toString(16).toUpperCase().padStart(8, "0")} Loading...
        </div>
      );
    }

    // チャンクから必要な16バイトを切り出す
    const rowData = chunk.subarray(localOffset, localOffset + BYTES_PER_ROW);

    // アドレス
    const address = globalOffset.toString(16).toUpperCase().padStart(8, "0");

    // Hex
    const hexParts = [];

    for (let i = 0; i < BYTES_PER_ROW; i++) {
      if (i < rowData.length) {
        hexParts.push(rowData[i].toString(16).toUpperCase().padStart(2, "0"));
      } else {
        hexParts.push("  ");
      }
    }

    // ASCII
    const ascii = Array.from(rowData)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");

    return (
      <div
        className="flex font-mono text-sm border-b border-gray-100 hover:bg-blue-50 items-center px-4 text-gray-700"
        style={style}
      >
        <span className="text-gray-400 select-none mr-4 w-20 flex-shrink-0">
          {address}
        </span>
        <span className="mr-4 w-[24rem] flex-shrink-0 whitespace-pre">
          {hexParts.join(" ")}
        </span>
        <span className="text-blue-600 opacity-80 border-l border-gray-200 pl-4 truncate">
          {ascii}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={rowCount}
            itemData={loadedChunks}
            itemSize={28}
            width={width}
            onItemsRendered={onItemsRendered}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};
