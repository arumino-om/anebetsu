import { Button } from "@heroui/button";
import { Divider } from "@heroui/react";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import PluginItem from "./item";

import {
  PluginsConfigPanelProps,
  PluginConfig,
  loadPluginsConfig,
  savePluginsConfig,
  generateId,
} from ".";

export default function PluginsConfigPanel({
  onSave,
}: PluginsConfigPanelProps) {
  const [plugins, setPlugins] = useState<PluginConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 初期読み込み
  useEffect(() => {
    setPlugins(loadPluginsConfig());
  }, []);

  // プラグインを追加
  const handleAdd = useCallback(() => {
    const newPlugin: PluginConfig = {
      id: generateId(),
      url: "",
      entryFunction: "",
    };

    setPlugins((prev) => [...prev, newPlugin]);
    setHasChanges(true);
  }, []);

  // プラグインのフィールドを更新
  const handleChange = useCallback(
    (id: string, field: keyof Omit<PluginConfig, "id">, value: string) => {
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      );
      setHasChanges(true);
    },
    [],
  );

  // プラグインを削除
  const handleRemove = useCallback((id: string) => {
    setPlugins((prev) => prev.filter((p) => p.id !== id));
    setHasChanges(true);
  }, []);

  // 保存
  const handleSave = useCallback(() => {
    // 空のエントリを除外して保存
    const validPlugins = plugins.filter(
      (p) => p.url.trim() !== "" && p.entryFunction.trim() !== "",
    );

    savePluginsConfig(validPlugins);
    setPlugins(validPlugins);
    setHasChanges(false);
    onSave?.(validPlugins);
  }, [plugins, onSave]);

  // リセット（保存済みの状態に戻す）
  const handleReset = useCallback(() => {
    setPlugins(loadPluginsConfig());
    setHasChanges(false);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">プラグイン設定</h2>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus size={16} />}
          variant="flat"
          onPress={handleAdd}
        >
          追加
        </Button>
      </div>
      <Divider className="mb-4" />
      <div>
        {plugins.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>プラグインが登録されていません</p>
            <p className="text-sm mt-2">
              「追加」ボタンでプラグインを追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto overflow-x-visible max-h-96">
            {plugins.map((plugin) => (
              <PluginItem
                key={plugin.id}
                plugin={plugin}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {plugins.length > 0 && (
          <>
            <Divider className="my-4" />
            <div className="flex justify-end gap-2">
              <Button
                isDisabled={!hasChanges}
                size="sm"
                startContent={<RotateCcw size={16} />}
                variant="flat"
                onPress={handleReset}
              >
                リセット
              </Button>
              <Button
                color="primary"
                isDisabled={!hasChanges}
                size="sm"
                startContent={<Save size={16} />}
                onPress={handleSave}
              >
                保存
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
