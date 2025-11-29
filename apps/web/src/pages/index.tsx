import { useState } from "react";
import { Button, useDisclosure, HeroUIProvider } from "@heroui/react";
import { Menu, Box, X } from "lucide-react";

import { FileInfoPanel } from "@/components/common/file-info";

export default function IndexPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeroUIProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        <div className="hidden md:flex w-80 flex-col border-r border-gray-200 p-6 bg-white z-20 shadow-sm">
          <FileInfoPanel file={selectedFile} onFileSelect={setSelectedFile} />
        </div>

        <div className="flex-1 relative flex flex-col bg-gray-50/50">
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 z-10">
            <span className="font-bold text-lg">anebetsu</span>
            <Button
              isIconOnly
              variant="light"
              onPress={setIsMenuOpen.bind(null, true)}
            >
              <Menu />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {selectedFile ? (
              <div className="w-full h-full flex items-center justify-center">
                {selectedFile.type.startsWith("image/") ? (
                  <img
                    alt="Preview"
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg bg-white"
                    src={URL.createObjectURL(selectedFile)}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Processing with Wasm...</p>
                    <p className="text-sm mt-2">{selectedFile.name}</p>
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
          <button
            className="w-full flex justify-center mb-4"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
          </button>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">File Menu</h2>
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
