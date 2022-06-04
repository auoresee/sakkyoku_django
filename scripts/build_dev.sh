#!/bin/bash
npm run build && cp -v dist/* ../sakkyokuapp/static/sakkyokuapp/javascript/ && \
    make -C sf2js wasm && cp -v sf2js/tfs.js sf2js/tfs.wasm ../sakkyokuapp/static/sakkyokuapp/javascript/ && \
    cp -v sf2js/tfs.data ../sakkyokuapp/static/sakkyokuapp/javascript/
