"use strict";

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const dir = "./lib";

const dist = path.resolve(__dirname, "dist");
const devtool = "source-map";

const rules = [
  {
    test: /\.css$/,
    use: ["style-loader", "css-loader", "clean-css-loader"],
  },
  {
    test: /\.(png|gif|svg|woff|woff2|eot|ttf)$/,
    use: [
      {
        loader: "url-loader",
        options: {
          limit: 50_000,
        },
      },
    ],
  },
];

const optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      extractComments: true,
    }),
  ],
};

const filename = `[name].min.js`;

module.exports = {
  devtool,
  entry: {
    darktalk: `${dir}/darktalk.js`,
  },
  optimization,
  output: {
    library: "darktalk",
    filename,
    path: dist,
    pathinfo: true,
    libraryTarget: "var",
    devtoolModuleFilenameTemplate,
  },
  module: {
    rules,
  },
};

function devtoolModuleFilenameTemplate(info) {
  const resource = info.absoluteResourcePath.replace(__dirname + path.sep, "");
  return `file://darktalk/${resource}`;
}
