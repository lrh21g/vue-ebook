<template>
  <div class="ebook-reader">
    <div id="read"></div>
  </div>
</template>

<script>
import Epub from 'epubjs'
import { ebookMixin } from '@/utils/mixin'
import { getFontFamily, saveFontFamily, saveFontSize, getFontSize, getTheme, saveTheme, getLocation } from '../../utils/localStorage'

global.epub = Epub

export default {
  mixins: [ebookMixin],
  mounted () {
    // 路由参数 fileName 格式为：History|2017_Book_InterdisciplinaryPerspectivesO
    // 设置 fileName 为 History/2017_Book_InterdisciplinaryPerspectivesO
    this.setFileName(this.$route.params.fileName.split('|').join('/'))
      .then(() => {
        this.initEpub() // 初始化 Epub
      })
  },
  methods: {
    // 上一页
    prevPage () {
      if (this.rendition) {
        this.rendition.prev()
      }
      this.hideMenuVisible()
    },
    // 下一页
    nextPage () {
      if (this.rendition) {
        this.rendition.next()
      }
      this.hideMenuVisible()
    },
    // 显示/隐藏 头部和设置菜单
    toggleTitleAndMenu () {
      if (this.menuVisible) {
        this.setSettingVisible(-1) // 隐藏阅读器设置面板（-1:不显示，0:字号，1:主题，2:进度，3:目录）
        this.setFontFamilyVisible(false) // 隐藏字体设置面板
      }
      this.setMenuVisible(!this.menuVisible) // 设置阅读器设置菜单的 显示/隐藏
    },
    // 隐藏阅读器设置菜单
    hideMenuVisible () {
      this.setMenuVisible(false) // 隐藏阅读器设置菜单
      this.setSettingVisible(-1) // 隐藏阅读器设置面板（-1:不显示，0:字号，1:主题，2:进度，3:目录）
      this.setFontFamilyVisible(false) // 隐藏字体设置面板
    },
    // 初始化字体大小
    initFontSize () {
      let fontSize = getFontSize(this.fileName) // 获取对应电子书缓存中的字体大小
      if (!fontSize) {
        saveFontSize(this.fileName, this.defaultFontSize) // 缓存对应电子书的默认字体大小，默认为 16
      } else {
        this.rendition.themes.fontSize(fontSize) // 设置阅读器字体大小
        this.setDefaultFontSize(fontSize)
      }
    },
    // 初始化字体
    initFontFamily () {
      let font = getFontFamily(this.fileName) // 获取对应电子书缓存中的字体
      if (!font) {
        saveFontFamily(this.fileName, this.defaultFontFamily) // 缓存对应电子书的默认字体
      } else {
        this.rendition.themes.font(font) // 设置阅读器字体
        this.setDefaultFontFamily(font)
      }
    },
    // 初始化主题
    initTheme () {
      let defaultTheme = getTheme(this.fileName) // 获取对应电子书缓存中主题
      if (!defaultTheme) {
        defaultTheme = this.themeList[0].name // 默认主题为主题列表中的第一个
        saveTheme(this.fileName, defaultTheme)
      }
      this.setDefaultTheme(defaultTheme) // 设置全局样式
      this.setGlobalTheme(defaultTheme) // 设置全局样式
      this.themeList.forEach(theme => {
        this.rendition.themes.register(theme.name, theme.style) // 注册主题
      })
      this.rendition.themes.select(defaultTheme) // 设置阅读器主题为默认主题
    },
    // 初始化Rendition对象
    initRendition () {
      // 通过 Book.renderTo 生成 Rendition对象
      // Book.renderTo(element) 将解析好的图书追加到某个HTML结点并渲染，此时epub图书内容在HTML中呈现。（使用的是iframe标签）
      this.rendition = this.book.renderTo('read', {
        width: innerWidth,
        height: innerHeight,
        method: 'default'
      })
      const location = getLocation(this.fileName) // 获取对应电子书缓存的位置
      // 渲染电子书
      this.display(location, () => {
        this.initTheme() // 初始化主题
        this.initFontSize() // 初始化字体大小
        this.initFontFamily() // 初始化字体
        this.refreshLocation() // 更新电子书位置
      })
      this.rendition.hooks.content.register(contents => {
        // addStylesheet：将样式表添加到文档（document）头部
        // 添加字体文件（因为电子书的渲染到 iframe标签 中的，所以样式表添加到 iframe标签 中的头部）
        Promise.all([
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/daysOne.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/tangerine.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/montserrat.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/cabin.css`)
        ]).then(() => {})
      })
    },
    // 初始化手势
    initGesture () {
      this.rendition.on('touchstart', event => {
        this.touchStartX = event.changedTouches[0].clientX
        this.touchStartTime = event.timeStamp
      })
      this.rendition.on('touchend', event => {
        const offsetX = event.changedTouches[0].clientX - this.touchStartX
        const time = event.timeStamp - this.touchStartTime
        if (time < 500 && offsetX > 40) {
          this.prevPage() // 上一页
        } else if (time < 500 && offsetX < -40) {
          this.nextPage() // 下一页
        } else {
          this.toggleTitleAndMenu() // 显示/隐藏 头部和设置菜单栏
        }
        event.preventDefault() // 取消事件的默认动作
        event.stopPropagation() // 阻止捕获和冒泡阶段中当前事件的进一步传播
      })
    },
    // 初始化 Epub
    initEpub () {
      const url = `${process.env.VUE_APP_EPUB_URL}/${this.fileName}.epub`
      this.book = new Epub(url) // 生成Book对象
      this.setCurrentBook(this.book) // vuex 设置全局Book对象
      this.initRendition() // 初始化Rendition对象
      this.initGesture() // 初始化手势
      // Book对象的钩子函数 ready
      this.book.ready.then(() => {
        // 分页：一页显示文字数
        return this.book.locations.generate(750 * (window.innerWidth / 375) * (getFontSize(this.fileName) / 16))
      }).then(locations => {
        this.setBookAvailable(true) // 设置进度条为可以滑动
        this.refreshLocation() // 更新电子书位置
      })
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global.scss";
</style>
