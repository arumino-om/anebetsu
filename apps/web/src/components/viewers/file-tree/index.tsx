import { useState } from "react";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Archive,
} from "lucide-react";
import { ScrollShadow } from "@heroui/react";

import { FileNode } from "@/types/file-tree";

// 1つのノード（ファイル or フォルダ）を表示する再帰コンポーネント
const TreeNode = ({ node, depth = 0 }: { node: FileNode; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (node.type === "directory") {
      setIsOpen(!isOpen);
    } else {
      // ファイルクリック時の処理（将来ここにプレビューロジックを入れます）
      // eslint-disable-next-line no-console
      console.log("File clicked:", node.name);
    }
  };

  return (
    <div>
      <button
        className={`
          flex items-center py-1.5 px-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors select-none text-sm
          ${depth > 0 ? "ml-4" : ""}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {/* 開閉アイコン（フォルダのみ） */}
        <span className="mr-1 text-gray-400 flex-shrink-0 w-4 flex justify-center">
          {node.type === "directory" &&
            (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>

        {/* ファイル種別アイコン */}
        <span
          className={`mr-2 flex-shrink-0 ${node.type === "directory" ? "text-blue-500" : "text-gray-500"}`}
        >
          {node.type === "directory" ? (
            <Folder fill="currentColor" fillOpacity={0.2} size={16} />
          ) : (
            <FileText size={16} />
          )}
        </span>

        {/* ファイル名 */}
        <span className="text-gray-700 truncate font-medium">{node.name}</span>

        {/* ファイルサイズ (ファイルのみ表示) */}
        {node.size !== undefined && node.type === "file" && (
          <span className="ml-auto text-xs text-gray-400 pl-4 font-mono">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </button>

      {/* 子要素の展開（再帰描画） */}
      {isOpen && node.children && (
        <div className="border-l border-gray-200 ml-[19px]">
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.name}-${i}`}
              depth={depth + 1}
              node={child}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// メインコンポーネント
export const FileTreeViewer = ({ root }: { root: FileNode }) => {
  if (!root) return <div className="p-4 text-gray-400">No structure data</div>;

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-inner border border-gray-200 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Archive className="text-orange-500" size={18} />
        <span className="font-semibold text-gray-700 text-sm">
          Archive Explorer
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Read Only</span>
        </div>
      </div>

      {/* ツリー本体（スクロール可能エリア） */}
      <ScrollShadow className="flex-1 p-2 overflow-auto">
        <TreeNode node={root} />
      </ScrollShadow>
    </div>
  );
};
