const { loadEnvironment } = require('./scripts/build-env');

module.exports = {
  plugins: [
    new (require('webpack')).DefinePlugin({
      'process.env': JSON.stringify(loadEnvironment())
    })
  ]
}; 