module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '__BASE_URL__'
    : '/',
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: true,
  devServer: {
    proxy: {
      '^/iwp/FewsWebServices/': {
        target: 'https://rwsos-dataservices-ont.avi.deltares.nl',
        changeOrigin: true
      },
    }
  }
}
