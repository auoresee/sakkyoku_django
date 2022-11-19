const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/IndexMain.ts',
        sequencer: './src/SequencerMain.ts',
        'sf2-worklet': './src/SF2Worklet.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    devtool: 'source-map',
};
