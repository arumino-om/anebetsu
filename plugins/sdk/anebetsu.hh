#pragma once
#include <emscripten/bind.h>
#include <string>
#include <sstream>
#include <iomanip>

namespace anebetsu {
    /**
     * @brief 文字列をJSON安全な形式にエスケープする
     * @details 改行やダブルクォートを \n, \" などに変換する
     * @param s エスケープする文字列
     * @return エスケープされた文字列
     */
    inline std::string escape_json(const std::string &s) {
        std::ostringstream o;
        for (auto c : s) {
            switch (c) {
            case '"': o << "\\\""; break;
            case '\\': o << "\\\\"; break;
            case '\b': o << "\\b"; break;
            case '\f': o << "\\f"; break;
            case '\n': o << "\\n"; break;
            case '\r': o << "\\r"; break;
            case '\t': o << "\\t"; break;
            default:
                if ('\x00' <= c && c <= '\x1f') {
                    o << "\\u"
                      << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                } else {
                    o << c;
                }
            }
        }
        return o.str();
    }


    /**
     * @brief テキストデータを返す
     * @param content 返却するテキスト内容
     * @param language シンタックスハイライト用の言語識別子（デフォルト: "plaintext"）
     * @return JSON形式の結果文字列
     */
    inline std::string return_text(const std::string& content, const std::string& language = "plaintext") {
        return "{" 
            "\"type\": \"text\","
            "\"payload\": {"
                "\"content\": \"" + escape_json(content) + "\","
                "\"language\": \"" + escape_json(language) + "\""
            "}"
        "}";
    }

    /**
     * @brief エラーを返す
     * @param message エラーメッセージ
     * @return JSON形式のエラー結果文字列
     */
    inline std::string return_error(const std::string& message) {
        return "{"
            "\"type\": \"error\","
            "\"payload\": {"
                "\"message\": \"" + escape_json(message) + "\""
            "}"
        "}";
    }

    // TODO: 将来的に image, video などのヘルパーもここに追加
}

/**
 * @brief プラグインのエントリポイントを定義するマクロ
 * @param FUNC_NAME プラグインの処理関数名
 * @code
 * // 使用例:
 * std::string my_process(const std::string& data) {
 *     return anebetsu::return_text(data);
 * }
 * ANEBETSU_PLUGIN(my_process)
 * @endcode
 */
#define ANEBETSU_PLUGIN(FUNC_NAME) \
    EMSCRIPTEN_BINDINGS(anebetsu_plugin) { \
        emscripten::function("process", FUNC_NAME); \
    }