tfs.wasm tfs.js tfs.data: bridge.c FluidR3_GM.sf2 Makefile
	emcc -o tfs.js bridge.c --preload-file FluidR3_GM.sf2 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_RUNTIME_METHODS='["cwrap"]'

.PHONY: wasm
wasm: tfs.wasm tfs.js tfs.data

.PHONY: clean
clean:
	rm -rf tfs.wasm tfs.js tfs.data
