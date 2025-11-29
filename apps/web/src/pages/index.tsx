/* eslint-disable no-console */
import { useEffect, useRef, useState } from "react";
import { Button, HeroUIProvider, Switch } from "@heroui/react";
import { Menu, Box, X, Binary } from "lucide-react";

import { FileInfoPanel } from "@/components/common/file-info";
import { PluginsConfigModal } from "@/components/plugins-config";
import { findPluginIdForFile, DEFAULT_PLUGINS } from "@/config/plugins";
import { CodeViewer } from "@/components/viewers/code-viewer";
import { loadPluginsConfig } from "@/components/plugins-config";
import { HexViewer } from "@/components/viewers/hex";

export default function IndexPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBinaryMode, setIsBinaryMode] = useState(false);

  const [wasmStatus, setWasmStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/file-processor.worker.ts", import.meta.url),
      { type: "classic" },
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "READY") setWasmStatus("ready");
      if (type === "RESULT") setAnalysisResult(payload);
      if (type === "ERROR") console.error(payload);
    };

    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (!selectedFile || !workerRef.current || wasmStatus !== "ready") return;

    // 1. 画像はスキップ
    if (selectedFile.type.startsWith("image/")) return;

    // 2. プラグインを探す
    // ユーザー設定(localStorage)とデフォルトをマージして検索
    const userPlugins = loadPluginsConfig();
    const allPlugins = [...DEFAULT_PLUGINS, ...userPlugins];

    const pluginId = findPluginIdForFile(selectedFile.name);
    const targetPlugin = allPlugins.find((p) => p.id === pluginId);

    if (targetPlugin) {
      setAnalysisResult(null);
      // プラグイン情報ごとWorkerに投げる！
      workerRef.current.postMessage({
        file: selectedFile,
        plugin: targetPlugin,
      });
    } else {
      console.warn("No plugin found for:", selectedFile.name);
      // プラグインが見つからない場合のフォールバック（HexViewerなど）へ
    }
  }, [selectedFile, wasmStatus]);

  const renderContent = () => {
    if (!selectedFile) return <div className="...">No file selected</div>;

    // A. 画像 (Web Native)
    if (selectedFile.type.startsWith("image/")) {
      return (
        <img
          alt={selectedFile.name}
          className="force-sdr ..."
          src={URL.createObjectURL(selectedFile)}
        />
      );
    }

    // B. Workerからの解析結果待ち
    if (!analysisResult) {
      return <div className="...">Processing...</div>;
    }

    // C. 解析結果の表示 (タイプ別分岐)
    switch (analysisResult.type) {
      case "text":
        return <CodeViewer content={analysisResult.payload.content} />;

      // 将来ここに追加: case 'tree': return <TreeViewer ... />

      default:
        return <div>Unknown Result Type: {analysisResult.type}</div>;
    }
  };

  return (
    <HeroUIProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        {/* PC用画面 */}
        <div className="hidden md:flex w-80 flex-col border-r border-gray-200 p-6 bg-white z-20 shadow-sm gap-3">
          <div className="flex justify-between items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="flex gap-2 py-1.5 items-center">
              <Binary
                className={isBinaryMode ? "text-primary" : "text-gray-400"}
                size={16}
              />
              <span className="text-sm font-medium text-gray-600">
                Binary Mode
              </span>
            </div>
            <Switch
              isSelected={isBinaryMode}
              size="sm"
              onValueChange={setIsBinaryMode}
            />
          </div>
          <FileInfoPanel file={selectedFile} onFileSelect={setSelectedFile} />
          <PluginsConfigModal buttonText="Configure Plugins" />
        </div>

        <div className="flex-1 relative flex flex-col bg-gray-50/50">
          {/* スマホ用ヘッダー */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 z-10">
            <span className="font-bold text-lg">anebetsu</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Binary
                  className={isBinaryMode ? "text-primary" : "text-gray-400"}
                  size={16}
                />
                <span className="text-sm font-medium text-gray-600">
                  Binary Mode
                </span>
                <Switch
                  isSelected={isBinaryMode}
                  size="sm"
                  onValueChange={setIsBinaryMode}
                />
              </div>

              <Button
                isIconOnly
                className="md:hidden"
                variant="light"
                onPress={() => setIsMenuOpen(true)}
              >
                <Menu />
              </Button>
            </div>
          </div>

          {/* プレビュー画面 */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {selectedFile ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* ★ 分岐ロジック: バイナリモードなら最優先で表示 */}
                {isBinaryMode ? (
                  <HexViewer
                    key={selectedFile.name + selectedFile.lastModified}
                    file={selectedFile}
                  />
                ) : selectedFile.type.startsWith("image/") ? (
                  <img
                    alt="Preview"
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg bg-white force-sdr"
                    src={URL.createObjectURL(selectedFile)}
                  />
                ) : analysisResult ? (
                  /* Wasm解析結果の表示 (Text/Treeなど) */
                  renderContent()
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Processing...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Box className="mb-4 opacity-20" size={48} />
                <p>No file selected</p>
              </div>
            )}
          </div>
        </div>

        {/* スマホ用メニュー */}
        <button
          className={`
            fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ease-out
            ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          className={`
            fixed bottom-0 left-0 right-0 z-50 md:hidden 
            bg-white rounded-t-2xl shadow-2xl p-6 h-[70vh]
            transform transition-transform duration-300 ease-out cubic-bezier(0.16, 1, 0.3, 1)
            ${isMenuOpen ? "translate-y-0" : "translate-y-full"}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">File Menu</h2>
            <PluginsConfigModal buttonText="Configure Plugins" />
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setIsMenuOpen(false)}
            >
              <X size={20} />
            </Button>
          </div>

          <div className="h-full overflow-y-auto pb-10">
            <FileInfoPanel
              file={selectedFile}
              onFileSelect={(f) => {
                setSelectedFile(f);
                setIsMenuOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </HeroUIProvider>
  );
}
