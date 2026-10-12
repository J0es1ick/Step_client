const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");
require("dotenv").config();
module.exports = (env = {}, argv = {}) => {
  const demo = env.demo === true || env.demo === "true";
  const basePath = "/" + String(env.base || "").replace(/^\/+|\/+$/g, "") + "/";
  const base = basePath === "//" ? "/" : basePath;
  return {
    mode: argv.mode || "production",
    entry: "./src/index.tsx",
    devtool: argv.mode === "development" ? "eval-source-map" : false,
    output: {
      publicPath: base,
      filename: "assets/[name].[contenthash:8].js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    resolve: { extensions: [".ts", ".tsx", ".js", ".json"] },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: { compilerOptions: { noEmit: false } },
          },
          exclude: /node_modules/,
        },
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
        { test: /\.(png|jpe?g|gif|svg|webp)$/i, type: "asset/resource" },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        basePath: base,
      }),
      new DefinePlugin({
        "process.env.REACT_APP_DEMO": JSON.stringify(String(demo)),
        "process.env.PUBLIC_URL": JSON.stringify(
          base === "/" ? "" : base.replace(/\/$/, ""),
        ),
      }),
    ],
    performance: { hints: false },
    devServer: {
      host: process.env.STORE_WEB_HOST || "127.0.0.1",
      port: process.env.STORE_WEB_PORT || 5180,
      historyApiFallback: true,
      open: false,
      hot: true,
      static: { directory: path.resolve(__dirname, "public") },
      proxy: demo
        ? []
        : [
            {
              context: ["/api"],
              target: process.env.STORE_API_URL || "http://127.0.0.1:5200",
            },
          ],
    },
  };
};
