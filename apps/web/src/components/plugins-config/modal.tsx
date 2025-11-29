import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";

import {
  PluginConfig,
  loadPluginsConfig,
  generateId,
  savePluginsConfig,
  PluginItem,
} from ".";

export default function PluginsConfigModal({
  buttonText,
}: {
  buttonText: string;
}) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const [plugins, setPlugins] = useState<PluginConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 初期読み込み
  useEffect(() => {
    setPlugins(loadPluginsConfig());
  }, [isOpen]);

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
    onClose();
  }, [plugins]);

  // リセット（保存済みの状態に戻す）
  const handleReset = useCallback(() => {
    setPlugins(loadPluginsConfig());
    setHasChanges(false);
  }, []);

  return (
    <>
      <Button onPress={onOpen}>{buttonText}</Button>
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-3">
                Plugins Config
                <Button color="primary" variant="flat" onPress={handleAdd}>
                  <Plus className="mr-2" size={16} />
                  追加
                </Button>
              </ModalHeader>
              <ModalBody>
                {plugins.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>プラグインが登録されていません</p>
                    <p className="text-sm mt-2">
                      「追加」ボタンでプラグインを追加してください
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
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
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  閉じる
                </Button>
                <Button color="primary" onPress={handleSave}>
                  保存
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
