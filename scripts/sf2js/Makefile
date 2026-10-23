# 埋め込む音源(SoundFont)のファイル。make SF2=xxx.sf2 wasm または環境変数 SF2 で変更できる
# (このディレクトリからの相対パス。空白と @ を含まない名前にする)
# どの音源も WASM の中では soundfont.sf2 という名前で読み込まれる (SF2Worker.js)
SF2 ?= soundfont.sf2

# emcc は1回で tfs.js、tfs.wasm、tfs.data を作る
# SF2Worker.js が使う _malloc / _free と HEAPU8 は、新しい Emscripten では既定で公開されないため明示する
tfs.js: bridge.c $(SF2) Makefile
	emcc -o tfs.js bridge.c --preload-file $(SF2)@soundfont.sf2 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='["_malloc","_free"]' -s EXPORTED_RUNTIME_METHODS='["cwrap","HEAPU8"]' -s MODULARIZE=1 -s EXPORT_NAME="createTFS"

tfs.wasm tfs.data: tfs.js

.PHONY: wasm
wasm: tfs.wasm tfs.js tfs.data

.PHONY: clean
clean:
	rm -rf tfs.wasm tfs.js tfs.data
