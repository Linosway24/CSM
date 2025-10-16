const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: './'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      },
      {
        test: /\.(json|geojson)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'data/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('./cesium/')
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/cesium/Build/Cesium',
          to: 'cesium'
        },
        {
          from: 'src/data',
          to: 'data'
        },
        {
          from: 'src/assets',
          to: 'assets'
        },
        {
          from: 'public/config.json',
          to: 'config.json'
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    })
  ],
  resolve: {
    alias: {
      '@zip.js/zip.js/lib/zip-no-worker.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/index.js')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    hot: true,
    open: true
  },
  mode: 'development',
  devtool: 'source-map'
};
