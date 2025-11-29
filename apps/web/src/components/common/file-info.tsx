import { useRef } from "react";
import { Button, Card, CardBody, Divider, Chip } from "@heroui/react";
import { Upload, FileText, Image as ImageIcon, Box } from "lucide-react";

export const FileInfoPanel = ({
  file,
  onFileSelect,
}: {
  file: File | null;
  onFileSelect: (f: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ヘッダーエリア */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Box size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">anebetsu</h1>
      </div>

      <Divider />

      {/* ファイル選択エリア */}
      {!file ? (
        <button
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-h-[200px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 font-medium">Click to Upload</p>
          <p className="text-gray-400 text-sm">or drag and drop</p>
        </button>
      ) : (
        <Card className="shadow-sm border border-gray-200">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="text-blue-500" />
                ) : (
                  <FileText className="text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatSize(file.size)}
                </p>
                <div className="flex gap-2 mt-2">
                  <Chip color="secondary" size="sm" variant="flat">
                    {file.type || "Unknown"}
                  </Chip>
                </div>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              color="danger"
              size="sm"
              variant="light"
              onPress={() => fileInputRef.current?.click()}
            >
              Change File
            </Button>
          </CardBody>
        </Card>
      )}

      {/* 隠しinput */}
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
};
