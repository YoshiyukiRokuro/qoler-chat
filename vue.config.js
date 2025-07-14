// vue.config.js

const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // pagesオプションを追加します
  pages: {
    index: {
      // エントリーポイント
      entry: 'src/main.js',
      // 使用するテンプレート
      template: 'public/index.html',
      // 出力されるファイル名
      filename: 'index.html',
      // ここでタイトルを指定することもできます
      title: 'Qoler-Chat',
      icon: 'public/icons/favicon.ico' // アイコンのパスを指定
    }
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "Qoler-Chat",
        appId: "jp.qoler.qoler-chat",
        win: {
          target: "nsis"
        },
        nsis: {
          oneClick: true,
          perMachine: true,
          runAfterFinish: false
        }
      },
      nodeIntegrationInWorker: true,
      preload: 'src/preload.js'
    }
  },
  chainWebpack: config => {
    config.plugin('define').tap(definitions => {
      Object.assign(definitions[0], {
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
      return definitions
    })
  }
})