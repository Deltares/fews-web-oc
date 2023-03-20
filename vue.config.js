module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.VUE_APP_PUBLIC_PATH
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
