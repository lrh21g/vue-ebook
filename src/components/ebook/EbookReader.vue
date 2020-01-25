<template>
  <div class="ebook-reader">
    <!-- Epub书签功能需要通过蒙版实现 -->
    <!-- 原因：rendition对象，无法绑定 touchmove 事件 -->
    <!-- 修饰符 .left --- 左键点击 -->
    <div class="ebook-reader-mask"
      @touchmove="move"
      @touchend="moveEnd"
      @mousedown.left="onMouseEnter"
      @mousemove.left="onMouseMove"
      @mouseup.left="onMouseEnd"
      @click="onMaskClick"></div>
    <div class="read-wrapper">
      <div id="read"></div>
    </div>
    <!-- <div id="read"></div> -->
  </div>
</template>

<script>
import Epub from 'epubjs'
import { ebookMixin } from '@/utils/mixin'
import { getFontFamily, saveFontFamily, saveFontSize, getFontSize, getTheme, saveTheme, getLocation, saveMetadata } from '../../utils/localStorage'
import { getLocalForage } from '../../utils/localForage'

global.epub = Epub

export default {
  mixins: [ebookMixin],
  mounted () {
    if (this.$route.params.fileName.indexOf('|') > 0) {
      // 路由参数 fileName 格式为：History|2017_Book_InterdisciplinaryPerspectivesO
      // 设置 fileName 为 History/2017_Book_InterdisciplinaryPerspectivesO
      this.setFileName(this.$route.params.fileName.split('|').join('/'))
        .then(() => {
          this.initEpub(`${process.env.VUE_APP_EPUB_URL}/${this.fileName}.epub`)
          this.isOnline = false
        })
    } else {
      this.setFileName(this.$route.params.fileName)
        .then(() => {
          getLocalForage(this.fileName, (err, blob) => {
            if (!err) {
              if (blob) {
                this.isOnline = false
                this.initEpub(blob)
              } else {
                this.isOnline = true
                const opf = this.$route.query.opf
                if (opf) this.initEpub(opf)
              }
            }
          })
        })
    }
  },
  methods: {
    // 蒙版 touchmove 事件：当触点在触控平面上移动时触发touchmove事件
    move (e) {
      let offsetY = 0
      if (this.firstOffsetY) {
        offsetY = e.changedTouches[0].clientY - this.firstOffsetY
        this.setOffsetY(offsetY)
      } else {
        this.firstOffsetY = e.changedTouches[0].clientY
      }
      e.preventDefault()
      e.stopPropagation()
    },
    // 蒙版 touchend 事件：当触点离开触控平面时触发touchend事件.
    moveEnd (e) {
      this.setOffsetY(0)
      this.firstOffsetY = 0
    },
    // mouse事件标识：
    // >>> 1 - 鼠标进入
    // >>> 2 - 鼠标进入后的移动
    // >>> 3 - 鼠标从移动状态松手
    // >>> 4 - 鼠标还原
    // 当鼠标指针移动到元素上方，并按下鼠标按键时，会发生 mousedown 事件
    // 与 click 事件不同，mousedown 事件仅需要按键被按下，而不需要松开即可发生。
    onMouseEnter (e) {
      this.mouseMove = 1
      this.mouseStartTime = e.timeStamp // 用于辅助判断鼠标事件
      e.preventDefault()
      e.stopPropagation()
    },
    // mousemove 事件会在鼠标指针移动时发生
    onMouseMove (e) {
      if (this.mouseMove === 1) {
        this.mouseMove = 2
      } else if (this.mouseMove === 2) {
        let offsetY = 0
        if (this.firstOffsetY) {
          offsetY = e.clientY - this.firstOffsetY
          this.setOffsetY(offsetY)
        } else {
          this.firstOffsetY = e.clientY
        }
      }
      e.preventDefault()
      e.stopPropagation()
    },
    // 当在元素上放松鼠标按钮时，会发生 mouseup 事件。
    onMouseEnd (e) {
      if (this.mouseMove === 2) {
        this.setOffsetY(0)
        this.firstOffsetY = 0
        this.mouseMove = 3
      }
      this.mouseEndTime = e.timeStamp
      const time = this.mouseEndTime - this.mouseStartTime
      if (time < 200) {
        this.mouseMove = 1
      }
      e.preventDefault()
      e.stopPropagation()
    },
    // 蒙版点击事件 click
    onMaskClick (e) {
      if (this.mouseMove === 2) {
      } else if (this.mouseMove === 1 || this.mouseMove === 4) {
        const offsetX = e.offsetX
        const width = window.innerWidth
        if (offsetX > 0 && offsetX < width * 0.3) {
          this.prevPage()
        } else if (offsetX > 0 && offsetX > width * 0.7) {
          this.nextPage()
        } else {
          this.toggleMenuVisible()
        }
      }
      this.mouseMove = 4
    },
    // 上一页
    prevPage () {
      if (this.rendition) {
        this.rendition.prev()
        this.refreshLocation()
      }
      this.hideMenuVisible()
    },
    // 下一页
    nextPage () {
      if (this.rendition) {
        this.rendition.next()
        this.refreshLocation()
      }
      this.hideMenuVisible()
    },
    // 初始化字体大小
    initFontSize () {
      let fontSize = getFontSize(this.fileName) // 获取对应电子书缓存中的字体大小
      if (!fontSize) {
        fontSize = 16
        saveFontSize(this.fileName, this.defaultFontSize) // 缓存对应电子书的默认字体大小，默认为 16
      }
      return fontSize
    },
    // 初始化字体
    initFontFamily () {
      let font = getFontFamily(this.fileName) // 获取对应电子书缓存中的字体
      if (!font) {
        font = 'Default'
        saveFontFamily(this.fileName, font)
      }
      return font
    },
    // 初始化主题
    initTheme () {
      let defaultTheme = getTheme(this.fileName)
      if (!defaultTheme) {
        defaultTheme = this.themeList[0].name
        saveTheme(this.fileName, defaultTheme)
      }
      return defaultTheme
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
      Promise.all([
        this.setDefaultTheme(this.initTheme()), // 初始化主题，并设置默认主题
        this.setDefaultFontSize(this.initFontSize()), // 初始化字体大小，并设置默认字体大小
        this.setDefaultFontFamily(this.initFontFamily()) // 初始化字体，并设置默认字体
      ]).then(() => {
        // this.refreshLocation() // 更新电子书位置
        this.switchTheme()
        if (this.$route.query.navigation) {
          this.display(this.$route.query.navigation)
        } else {
          const location = getLocation(this.fileName) // 获取对应电子书缓存的位置
          if (location) {
            this.display(location)
          } else {
            this.display()
          }
        }
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
          this.toggleMenuVisible() // 显示/隐藏 头部和设置菜单栏
        }
        event.preventDefault() // 取消事件的默认动作
        event.stopPropagation() // 阻止捕获和冒泡阶段中当前事件的进一步传播
      })
    },
    // 解析电子书内容
    parseBook () {
      // this.book.loaded.cover -- 获取封面加载信息
      this.book.loaded.cover.then(cover => {
        // archive - 从 Epub数据存档中 解压缩请求文件
        // createUrl - 创建一个url
        this.book.archive.createUrl(cover).then(url => {
          this.setCover(url) // 设置电子书封面
        })
      })
      // this.book.loaded.metadata -- 获取标题和作者信息
      this.book.loaded.metadata.then(metadata => {
        this.setMetadata(metadata)
        saveMetadata(this.fileName, metadata)
      })
      // this.book.loaded.navigation -- 获取导航信息
      this.book.loaded.navigation.then(nav => {
        console.log('电子书目录：', nav)
        // 使用递归，将层级目录扁平化
        const navItem = (function flatten (arr) {
          return [].concat(...arr.map(v => [v, ...flatten(v.subitems)]))
        })(nav.toc) // nav.toc - 一级目录数组，一级目录下子目录数组为 subitems。 --- 层级目录
        // 划分层级：二级目录中的 parent 对应 一级目录中的 id，以此类推
        function find (item, v = 0) {
          const parent = navItem.filter(it => it.id === item.parent)[0]
          return !item.parent ? v : (parent ? find(parent, ++v) : v)
        }
        navItem.forEach(item => {
          item.level = find(item)
          item.total = 0
          item.pagelist = []
          if (item.href.match(/^(.*)\.html$/)) {
            item.idhref = item.href.match(/^(.*)\.html$/)[1]
          } else if (item.href.match(/^(.*)\.xhtml$/)) {
            item.idhref = item.href.match(/^(.*)\.xhtml$/)[1]
          }
        })
        this.setNavigation(navItem)
      })
      // Book对象的钩子函数 ready
      this.book.ready.then(() => {
        // 分页：一页显示文字数
        return this.book.locations.generate(750 * (window.innerWidth / 375) * (getFontSize(this.fileName) / 16))
      }).then(locations => {
        locations.forEach(location => {
          const loc = location.match(/\[(.*)\]!/)[1]
          console.log(loc)
          this.navigation.forEach(item => {
            if (item.idhref && item.idhref.indexOf(loc) >= 0) {
              item.pagelist.push(location)
            }
          })
          let currentPage = 1
          this.navigation.forEach((item, index) => {
            if (index === 0) {
              item.page = 1
            } else {
              item.page = currentPage
            }
            currentPage += item.pagelist.length + 1
          })
        })
        this.setPagelist(locations)
        this.setBookAvailable(true) // 设置进度条为可以滑动
        this.setIsPaginating(false)
        this.refreshLocation() // 更新电子书位置
      })
    },
    // 初始化 Epub
    initEpub (target) {
      this.book = new Epub(target) // 生成Book对象
      this.setCurrentBook(this.book) // vuex 设置全局Book对象
      this.setIsPaginating(true)
      this.setPaginate(this.$t('book.paginating'))
      this.initRendition() // 初始化Rendition对象
      this.initGesture() // 初始化手势
      this.parseBook() // 解析电子书内容
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global.scss";

  .ebook-reader {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .ebook-reader-mask {
      position: absolute;
      z-index: 150;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
</style>
