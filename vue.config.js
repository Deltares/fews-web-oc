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
  },
  chainWebpack: config => {
    config.module
      .rule("i18n")
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use("i18n")
      .loader("@intlify/vue-i18n-loader")
      .end();
  },

  pluginOptions: {
    i18n: {
      localeDir: 'locales',
      enableInSFC: true
    }
  }
}
