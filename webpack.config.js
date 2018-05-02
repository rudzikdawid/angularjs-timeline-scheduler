const webpack = require('webpack');
const env = process.env.WEBPACK_ENV;
const path = require('path');
const extractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    output: {
        path: __dirname + '/dist',
        filename: "angularjs-timeline-scheduler.js",
        library: 'angularjs-timeline-scheduler',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loaders: ['babel-loader?presets[]=es2015'],
                exclude: /(node_modules)/
            },
            {
                test: /\.(html)$/,
                loaders: ['ngtemplate-loader', 'html-loader']
            },
            {
                test: /\.(css)$/,
                loaders: extractTextPlugin.extract({
                    use: 'css-loader'
                }),
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new extractTextPlugin("angularjs-timeline-scheduler.css")
    ]
};
