import { ScrollShadow } from "@heroui/react";

export const CodeViewer = ({ content }: { content: string }) => {
  return (
    <div className="w-full h-full bg-[#1e1e1e] rounded-lg shadow-inner overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
        <span className="text-xs text-gray-400 font-mono">
          Text Viewer (Read Only)
        </span>
        <span className="text-xs text-gray-500">{content.length} chars</span>
      </div>

      <ScrollShadow className="flex-1 p-4 overflow-auto">
        <pre className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-all">
          {content}
        </pre>
      </ScrollShadow>
    </div>
  );
};
