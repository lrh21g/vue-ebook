import { mapGetters, mapActions } from 'vuex'
import { FONT_SIZE_LIST, FONT_FAMILY, themeList, getReadTimeByMinute } from './book'
import { addCss, removeAllCss } from './utils'
import * as Storage from './localStorage'

export const ebookMixin = {
  computed: {
    ...mapGetters([
      'fileName',
      'menuVisible',
      'settingVisible',
      'defaultFontSize',
      'defaultFontFamily',
      'fontFamilyVisible',
      'defaultTheme',
      'bookAvailable',
      'progress',
      'section',
      'isPaginating',
      'currentBook',
      'navigation',
      'cover',
      'metadata',
      'paginate',
      'pagelist',
      'offsetY',
      'isBookmark',
      'speakingIconBottom'
    ]),
    // 主题列表
    themeList () {
      return themeList(this)
    },
    // 获取章节名称
    getSectionName () {
      if (this.section) {
        const section = this.currentBook.section(this.section)
        if (section && section.href && this.currentBook && this.currentBook.navigation) {
          return this.currentBook.navigation.get(section.href).label
          // return this.navigation[this.section].label
        }
      }
    }
  },
  data () {
    return {
      fontSizeList: FONT_SIZE_LIST,
      fontFamily: FONT_FAMILY
    }
  },
  methods: {
    ...mapActions([
      'setFileName',
      'setMenuVisible',
      'setSettingVisible',
      'setDefaultFontSize',
      'setDefaultFontFamily',
      'setFontFamilyVisible',
      'setDefaultTheme',
      'setBookAvailable',
      'setProgress',
      'setSection',
      'setIsPaginating',
      'setCurrentBook',
      'setNavigation',
      'setCover',
      'setMetadata',
      'setPaginate',
      'setPagelist',
      'setOffsetY',
      'setIsBookmark',
      'setSpeakingIconBottom'
    ]),
    // 隐藏阅读器菜单
    hideMenuVisible () {
      this.setMenuVisible(false)
    },
    // 显示阅读器设置：-1:不显示，0:字号，1:主题，2:进度，3:目录
    showSetting (key) {
      this.setSettingVisible(key)
    },
    // 阅读器设置 - 设置字体大小
    setFontSize (fontSize) {
      this.setDefaultFontSize(fontSize).then(() => {
        this.switchTheme()
        Storage.saveFontSize(this.fileName, fontSize)
      })
    },
    // 阅读器设置 - 显示字体设置
    showFontFamilySetting () {
      this.setFontFamilyVisible(true)
    },
    // 阅读器设置 - 隐藏字体设置
    hideFontFamilySetting () {
      this.setFontFamilyVisible(false)
    },
    // 阅读器设置 - 设置字体
    setFontFamily (font) {
      this.setDefaultFontFamily(font).then(() => {
        if (font === 'Default') {
          // 如果字体设置为默认
          this.currentBook.rendition.themes.font('Times New Roman') // 设置阅读器字体
        } else {
          this.currentBook.rendition.themes.font(font)
        }
        // this.switchTheme()
        Storage.saveFontFamily(this.fileName, font) // 缓存对应电子书的字体
      })
    },
    // 阅读器设置 - 主题设置
    setTheme (theme) {
      this.setDefaultTheme(theme).then(() => {
        // this.switchTheme()
        this.setGlobalTheme(theme) // 设置全局主题
        this.currentBook.rendition.themes.select(theme)
        Storage.saveTheme(this.fileName, theme) // 缓存对应电子书的主题
      })
    },
    switchTheme () {
      this.currentBook.rendition.themes.fontSize(this.defaultFontSize)
    },
    // 设置全局主题：通过引入css，来修改全局样式（在设置新的全局样式时，先移除之前的样式）
    setGlobalTheme (theme) {
      removeAllCss()
      switch (theme) {
        case 'Default':
          addCss(`${process.env.VUE_APP_RES_URL}/theme/theme_default.css`) // 引入css
          break
        case 'Eye':
          addCss(`${process.env.VUE_APP_RES_URL}/theme/theme_eye.css`)
          break
        case 'Gold':
          addCss(`${process.env.VUE_APP_RES_URL}/theme/theme_gold.css`)
          break
        case 'Night':
          addCss(`${process.env.VUE_APP_RES_URL}/theme/theme_night.css`)
          break
        default:
          this.setDefaultTheme('Default')
          addCss(`${process.env.VUE_APP_RES_URL}/theme/theme_default.css`)
          break
      }
    },
    // 通过改变进度条的进度渲染电子书
    displayProgress () {
      const cfi = this.currentBook.locations.cfiFromPercentage(this.progress / 100)
      // 通过Rendtion.display渲染电子书
      this.currentBook.rendition.display(cfi).then(() => {
        this.refreshLocation()
      })
    },
    // 渲染章节
    displaySection (cb) {
      const section = this.currentBook.section(this.section)
      if (section && section.href) {
        this.currentBook.rendition.display(section.href).then(() => {
          this.refreshLocation()
          if (cb) cb()
        })
      }
    },
    // 渲染书籍
    display (target, cb) {
      if (target) {
        this.currentBook.rendition.display(target).then(() => {
          // if (highlight) {
          //   if (target.startsWith('epubcfi')) {
          //     this.currentBook.getRange(target).then(range => {
          //       this.currentBook.rendition.annotations.highlight(target, {}, (e) => {
          //       })
          //     })
          //   }
          // }
          this.refreshLocation()
          if (cb) cb()
        })
      } else {
        this.currentBook.rendition.display().then(() => {
          this.refreshLocation()
          if (cb) cb()
        })
      }
      // this.hideMenuVisible()
    },
    // 更新电子书位置
    refreshLocation () {
      const currentLocation = this.currentBook.rendition.currentLocation() // 获取当前电子书位置
      const startCfi = currentLocation.start.cfi // 获取电子书位置的开始cfi
      const progress = this.currentBook.locations.percentageFromCfi(currentLocation.start.cfi) // 获取cif所在EpubCFI中的百分比
      this.setProgress(Math.floor(progress * 100)) // 设置阅读进度
      this.setSection(currentLocation.start.index) // 设置章节
      Storage.saveLocation(this.fileName, startCfi) // 缓存对应电子书的位置
      // const currentLocation = this.currentBook.rendition.currentLocation()
      // if (currentLocation.start && currentLocation.start.index) {
      //   this.setSection(currentLocation.start.index)
      //   const progress = this.currentBook.locations.percentageFromCfi(currentLocation.start.cfi)
      //   this.setProgress(Math.floor(progress * 100))
      //   if (this.pagelist) {
      //     if (currentLocation.start.location <= 0) {
      //       this.setPaginate('')
      //     } else {
      //       this.setPaginate(currentLocation.start.location + ' / ' + this.pagelist.length)
      //     }
      //   } else {
      //     this.setPaginate('')
      //   }
      //   const cfistart = currentLocation.start.cfi
      //   const bookmark = Storage.getBookmark(this.fileName)
      //   if (bookmark) {
      //     if (bookmark.some(item => item.cfi === cfistart)) {
      //       this.setIsBookmark(true)
      //     } else {
      //       this.setIsBookmark(false)
      //     }
      //   } else {
      //     this.setIsBookmark(false)
      //   }
      //   Storage.saveLocation(this.fileName, cfistart)
      // }
    },
    getReadTime () {
      return this.$t('book.haveRead').replace('$1', getReadTimeByMinute(this.fileName))
    }
  }
}
