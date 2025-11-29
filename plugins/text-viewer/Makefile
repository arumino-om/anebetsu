# Compiler settings
CXX         := em++
CXXFLAGS    := -O3 --bind

# Output settings
OUTDIR      := dist
TARGET      := $(OUTDIR)/text-viewer.js
EXPORT_NAME := createTextViewerPlugin

# Source files
SRCDIR      := src
SOURCES     := $(wildcard $(SRCDIR)/*.cc)

# Emscripten settings
EMFLAGS     := -s WASM=1 \
               -s MODULARIZE=1 \
               -s EXPORT_NAME="$(EXPORT_NAME)" \
               -s EXPORTED_FUNCTIONS="['ccall', 'cwrap']" \
               -s ALLOW_MEMORY_GROWTH=1

# Build targets
.PHONY: all clean rebuild

all: $(TARGET)

$(TARGET): $(SOURCES) | $(OUTDIR)
	$(CXX) $(SOURCES) -o $(TARGET) $(EMFLAGS) $(CXXFLAGS)

$(OUTDIR):
	mkdir -p $(OUTDIR)

clean:
	rm -rf $(OUTDIR)

rebuild: clean all