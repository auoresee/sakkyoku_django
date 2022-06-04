npm run build && copy dist\* ..\sakkyokuapp\static\sakkyokuapp\javascript\ && \
    make -C sf2js wasm && copy sf2js\tfs.js sf2js\tfs.wasm ..\sakkyokuapp\static\sakkyokuapp\javascript\ && \
    copy sf2js\tfs.data ..\sakkyokuapp\static\sakkyokuapp\javascript\
pause