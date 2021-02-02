var path = require('path')
module.exports = {
  entry: './js/index.js',
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'bundle.js'
  },
  devServer: {
    port: 7777,
    hot: true
  }
}