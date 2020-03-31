const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');
module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new EnvironmentPlugin(require('dotenv').config().parsed)
];
