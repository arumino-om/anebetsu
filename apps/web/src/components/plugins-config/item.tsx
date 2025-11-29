import { Button, Input, Card, CardBody } from "@heroui/react";
import { Trash2 } from "lucide-react";

import { PluginItemProps } from ".";

export default function PluginItem({
  plugin,
  onChange,
  onRemove,
}: PluginItemProps) {
  return (
    <Card className="mb-3">
      <CardBody className="gap-3">
        <Input
          label="URL"
          placeholder="https://example.com/plugin.js"
          size="sm"
          value={plugin.url}
          variant="bordered"
          onChange={(e) => onChange(plugin.id, "url", e.target.value)}
        />
        <Input
          label="エントリ関数名"
          placeholder="initPlugin"
          size="sm"
          value={plugin.entryFunction}
          variant="bordered"
          onChange={(e) => onChange(plugin.id, "entryFunction", e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            color="danger"
            size="sm"
            startContent={<Trash2 size={16} />}
            variant="light"
            onPress={() => onRemove(plugin.id)}
          >
            削除
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
