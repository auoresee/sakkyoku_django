const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/IndexMain.ts',
        sequencer: './src/SequencerMain.ts',
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
    }
};
