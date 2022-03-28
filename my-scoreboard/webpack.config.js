const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

dotenv.config();

const rootConfig = {
  mode: 'development',
  optimization: {
    usedExports: true, // tells webpack to tree-shake
  },
  devtool: 'eval-source-map',
};

const appConfig = {
  ...rootConfig,
  entry: './src/app.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public/scripts'),
  },
};

module.exports = {
  ...appConfig,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.FIREBASE_API_KEY': JSON.stringify(
        process.env.FIREBASE_API_KEY
      ),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(
        process.env.FIREBASE_AUTH_DOMAIN
      ),
      'process.env.FIREBASE_DATABASE_URL': JSON.stringify(
        process.env.FIREBASE_DATABASE_URL
      ),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(
        process.env.FIREBASE_PROJECT_ID
      ),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(
        process.env.FIREBASE_STORAGE_BUCKET
      ),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        process.env.FIREBASE_MESSAGING_SENDER_ID
      ),
      'process.env.FIREBASE_APP_ID': JSON.stringify(
        process.env.FIREBASE_APP_ID
      ),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(
        process.env.FIREBASE_MEASUREMENT_ID
      ),
    }),
  ],
};
