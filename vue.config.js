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
      title: 'クオラチャット',
      icon: 'public/icons/favicon.ico' // アイコンのパスを指定
    }
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "クオラチャット"
      },
      nodeIntegrationInWorker: true,
      preload: 'src/preload.js'
    }

  }
})