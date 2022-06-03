// @flow
import type { $Application } from "express";

const _ = require("lodash");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

function devMode(app: $Application, config: Object) {
  const entry = _.reduce(
    config.entry,
    (m: Object, v, k: string) => {
      m[k] = [
        require.resolve("@babel/polyfill"),
        require.resolve("react-hot-loader/patch"),
        require.resolve("webpack-hot-middleware/client"),
        v
      ];
      return m;
    },
    {}
  );

  const plugins = [
    new webpack.HotModuleReplacementPlugin(),
    ...config.plugins,
    new webpack.NamedModulesPlugin(),
    new ProgressBarPlugin({ clear: false }),
    new webpack.NoEmitOnErrorsPlugin()
  ];

  const compiler = webpack({ ...config, entry, plugins });

  app.use(
    webpackDevMiddleware(compiler, {
      hot: true,
      quiet: false,
      overlay: false,
      noInfo: false,
      lazy: false,
      clientLogLevel: "none",
      watchContentBase: true,
      stats: { colors: true },
      watchOptions: {
        ignored: /node_modules/
      },
      historyApiFallback: {
        disableDotRule: true
      },

      headers: { "Access-Control-Allow-Origin": "http://localhost" },
      publicPath: config.output.publicPath
    })
  );
  app.use(webpackHotMiddleware(compiler));
}

module.exports = devMode;
