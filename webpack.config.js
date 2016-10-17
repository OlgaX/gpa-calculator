var webpack = require('webpack');

module.exports = {
    entry: "./src/gpa-calculator.js",
    output: {
        path: __dirname + '/public/wp-content/special/gpa-calculator/',
        publicPath: "./wp-content/special/gpa-calculator/",
        filename: "gpa-calculator.js"
    },
    devtool: 'source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('production')
        }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      }),
      new webpack.ProvidePlugin({
        _: 'underscore'
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      })
    ],
    module: {
            loaders: [
            {
              test: /\.html$/,
              loader: "underscore-template-loader",
              exclude: [/node_modules/, /public/]
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader!autoprefixer-loader",
                exclude: [/node_modules/, /public/]
            },
            {
                test: /\.less$/,
                loader: "style-loader!css-loader!autoprefixer-loader!less-loader",
                exclude: [/node_modules/, /public/]
            },
        ]
    }
}
