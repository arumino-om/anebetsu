#include "../../sdk/anebetsu.hh"
#include <archive.h>
#include <archive_entry.h>
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <sstream>

// --- Node構造体とinsert_path関数は前回と同じなので省略可ですが、念のため再掲 ---
struct Node {
    std::string name;
    bool is_dir;
    size_t size;
    std::map<std::string, std::shared_ptr<Node>> children;
    Node(std::string n, bool dir, size_t s) : name(n), is_dir(dir), size(s) {}
    
    std::string to_json() const {
        std::stringstream ss;
        ss << "{" << "\"name\": \"" << anebetsu::escape_json(name) << "\","
           << "\"type\": \"" << (is_dir ? "directory" : "file") << "\","
           << "\"size\": " << size;
        if (is_dir) {
            ss << ", \"children\": [";
            bool first = true;
            for (const auto& pair : children) {
                if (!first) ss << ",";
                ss << pair.second->to_json();
                first = false;
            }
            ss << "]";
        }
        ss << "}";
        return ss.str();
    }
};

void insert_path(std::shared_ptr<Node> root, const std::string& path, size_t size, bool is_dir) {
    std::shared_ptr<Node> current = root;
    std::string current_path;
    std::stringstream ss(path);
    std::string segment;
    std::vector<std::string> parts;
    while (std::getline(ss, segment, '/')) {
        if (!segment.empty()) parts.push_back(segment);
    }
    if (parts.empty()) return;
    for (size_t i = 0; i < parts.size(); ++i) {
        bool is_last = (i == parts.size() - 1);
        std::string part = parts[i];
        if (current->children.find(part) == current->children.end()) {
            bool node_is_dir = !is_last || is_dir;
            size_t node_size = is_last ? size : 0;
            current->children[part] = std::make_shared<Node>(part, node_is_dir, node_size);
        }
        current = current->children[part];
    }
}
// ------------------------------------------------------------------

std::string process_archive_file(std::string filename) {
    struct archive *a = archive_read_new();
    archive_read_support_filter_all(a);
    archive_read_support_format_all(a);

    // ★重要: ファイルパスから開く (内部的にWORKERFS経由でアクセスされる)
    int r = archive_read_open_filename(a, filename.c_str(), 10240); // 10KBブロックサイズ
    
    if (r != ARCHIVE_OK) {
        std::string err = archive_error_string(a);
        archive_read_free(a);
        return anebetsu::return_error("Failed to open archive: " + err);
    }

    auto root = std::make_shared<Node>("root", true, 0);
    struct archive_entry *entry;

    // アーカイブ内のエントリを列挙
    while (archive_read_next_header(a, &entry) == ARCHIVE_OK) {
        std::string pathname = archive_entry_pathname(entry);
        size_t size = archive_entry_size(entry);
        // モード判定 (ディレクトリかどうか)
        mode_t mode = archive_entry_mode(entry);
        bool is_dir = S_ISDIR(mode) || pathname.back() == '/';

        insert_path(root, pathname, size, is_dir);
        
        // データ本体はスキップ (ヘッダーだけ読んで高速化)
        archive_read_data_skip(a);
    }

    archive_read_free(a);

    std::string json = "{ \"type\": \"tree\", \"payload\": { \"root\": ";
    json += root->to_json();
    json += "} }";
    return json;
}

ANEBETSU_FILE_PLUGIN(process_archive_file)