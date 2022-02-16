const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/IndexMain.ts'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../sakkyokuapp/static/sakkyokuapp/javascript/')
    }
};
