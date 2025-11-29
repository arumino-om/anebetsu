# --- プロジェクト設定 ---
PLUGIN_NAME := archive-viewer
EXPORT_NAME := createArchivePlugin

# パス設定
ROOT_DIR    := ../..
OUTDIR      := $(ROOT_DIR)/apps/web/public/plugins/$(PLUGIN_NAME)
TARGET      := $(OUTDIR)/plugin.js
SRCDIR      := src
SDK_DIR     := $(ROOT_DIR)/plugins/sdk

# ソースファイル (main.ccなど)
SOURCES     := $(wildcard $(SRCDIR)/*.cc)

# --- Libarchive 設定 ---
LIB_VER     := 3.7.2
LIB_DIR     := libarchive-$(LIB_VER)
LIB_STATIC  := $(LIB_DIR)/.libs/libarchive.a
LIB_URL     := https://libarchive.org/downloads/libarchive-$(LIB_VER).tar.gz

# --- コンパイラ設定 ---
CXX         := em++
# -I でヘッダーの場所を指定 (SDKとlibarchive)
CXXFLAGS    := -O3 -std=c++17 \
               -I$(SDK_DIR) \
               -I$(LIB_DIR)/libarchive

# --- Emscripten 設定 ---
# -s USE_ZLIB=1 : ブラウザ版のzlibを使用
# -s ALLOW_MEMORY_GROWTH=1 : 巨大ファイル対応
EMFLAGS     := -s WASM=1 \
               -s MODULARIZE=1 \
               -s EXPORT_NAME="$(EXPORT_NAME)" \
               -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'FS', 'WORKERFS']" \
               -s ALLOW_MEMORY_GROWTH=1 \
               -s USE_ZLIB=1 \
               -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
			   -lworkerfs.js \
			   -s FORCE_FILESYSTEM=1 \
               --bind

# --- ターゲット定義 ---
.PHONY: all clean clean-lib

all: $(TARGET)

# 1. プラグイン本体のビルド
#    libarchive.a が存在しなければ自動で作りにいく
$(TARGET): $(SOURCES) $(LIB_STATIC) | $(OUTDIR)
	@echo "Building Plugin: $(PLUGIN_NAME)..."
	$(CXX) $(SOURCES) $(LIB_STATIC) -o $(TARGET) $(EMFLAGS) $(CXXFLAGS)
	@echo "Build Complete! -> $(TARGET)"

# 2. 出力ディレクトリ作成
$(OUTDIR):
	mkdir -p $(OUTDIR)

# 3. libarchive のダウンロード & ビルド (存在しない場合のみ実行)
$(LIB_STATIC):
	@echo "Downloading & Building libarchive (this may take a while)..."
	@if [ ! -d "$(LIB_DIR)" ]; then \
		curl -L $(LIB_URL) | tar xz; \
	fi
	cd $(LIB_DIR) && emconfigure ./configure \
		--enable-static \
		--disable-shared \
		--without-xml2 \
		--without-openssl \
		--without-expat \
		--without-nettle \
		--without-lzo2 \
		--without-cng \
		--disable-acl \
		--disable-xattr \
		CFLAGS="-O3 -s USE_ZLIB=1"
	cd $(LIB_DIR) && emmake make -j$$(nproc)

# クリーンアップ (プラグインのみ)
clean:
	rm -rf $(OUTDIR)/plugin.js $(OUTDIR)/plugin.wasm

# 完全クリーンアップ (libarchiveも消す)
clean-all: clean
	rm -rf $(LIB_DIR)