#!/bin/bash
set -e

# libarchiveのバージョン
VERSION="3.7.2"
DIR_NAME="libarchive-$VERSION"
TAR_NAME="$DIR_NAME.tar.gz"

# ソースのダウンロード（なければ）
if [ ! -d "$DIR_NAME" ]; then
    echo "Downloading libarchive..."
    curl -L -o "$TAR_NAME" "https://libarchive.org/downloads/$TAR_NAME"
    tar xf "$TAR_NAME"
fi

cd "$DIR_NAME"

# Wasm用にビルド設定
# --without-xml2 --without-openssl 等: 重い依存関係を外して軽量化
# -s USE_ZLIB=1: Emscripten内蔵のzlibを使う
if [ ! -f "Makefile" ]; then
    echo "Configuring..."
    emconfigure ./configure \
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
fi

# コンパイル実行
echo "Building..."
emmake make -j$(nproc)

echo "Done! Library is at $(pwd)/.libs/libarchive.a"