const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// Build process inspired by:
// (1) Roskomsvoboda, censortracker, https://github.com/roskomsvoboda/censortracker/
// (2) Gourav Goyal, Notion-Boost-browser-extension, https://github.com/GorvGoyl/Notion-Boost-browser-extension

const BROWSER = process.env.BROWSER;
const ENV = process.env.NODE_ENV;
const IS_CHROME = BROWSER === "chrome";

let copyPatterns = [
    {
        from: "./src/assets/",
        to: path.resolve(__dirname, `dist/${BROWSER}/${ENV}/assets/`),
    },
];
let addBrowserPolyfill = false;
if (IS_CHROME) {
    copyPatterns.push({
        from: "./node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
        to: path.resolve(
            __dirname,
            `dist/${BROWSER}/${ENV}/js/browser-polyfill.min.js`
        ),
    });
    addBrowserPolyfill = true;
}

module.exports = {
    mode: ENV,
    devtool: "source-map",
    entry: {
        "js/background": "./src/js/background.js",
        "js/popup": "./src/js/popup.js",
    },
    output: {
        path: path.resolve(__dirname, `dist/${BROWSER}/${ENV}/`),
        filename: "[name].js",
    },
    resolve: {
        fallback: {
            os: false,
        },
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                path.resolve(__dirname, `dist/${BROWSER}/${ENV}/`),
            ],
        }),
        new MergeJsonWebpackPlugin({
            files: [
                "./src/manifest.common.json",
                `./src/manifest.${BROWSER}.json`,
            ],
            output: {
                fileName: "manifest.json",
            },
        }),
        new CopyPlugin({
            patterns: copyPatterns,
        }),
        new HtmlWebpackPlugin({
            title: "Censorship Detector",
            inject: false,
            filename: "popup.html",
            template: "./src/popup.ejs",
            addBrowserPolyfill,
        }),
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
        }),
    ],
};
