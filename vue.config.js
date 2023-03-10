module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '__BASE_URL__'
    : '/',
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: true
}
