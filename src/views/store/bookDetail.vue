<template>
  <div class="book-detail">
    <!-- 书籍详情头部 -->
    <detail-title @back="back" :showShelf="true" ref="title"></detail-title>
    <!-- 书籍详情滚动区域 -->
    <scroll class="content-wrapper"
        :top="42"
        :bottom="52"
        @onScroll="onScroll"
        ref="scroll">
      <!-- 书籍基本信息 -->
      <book-info :cover="cover" :title="title" :author="author" :desc="desc"></book-info>
      <!-- 书籍版权信息 -->
      <div class="book-detail-content-wrapper">
        <div class="book-detail-content-title">{{$t('detail.copyright')}}</div>
        <div class="book-detail-content-list-wrapper">
          <div class="book-detail-content-row">
            <div class="book-detail-content-label">{{$t('detail.publisher')}}</div>
            <div class="book-detail-content-text">{{publisher}}</div>
          </div>
          <div class="book-detail-content-row">
            <div class="book-detail-content-label">{{$t('detail.category')}}</div>
            <div class="book-detail-content-text">{{categoryText}}</div>
          </div>
          <div class="book-detail-content-row">
            <div class="book-detail-content-label">{{$t('detail.lang')}}</div>
            <div class="book-detail-content-text">{{lang}}</div>
          </div>
          <div class="book-detail-content-row">
            <div class="book-detail-content-label">{{$t('detail.ISBN')}}</div>
            <div class="book-detail-content-text">{{isbn}}</div>
          </div>
        </div>
      </div>
      <!-- 书籍目录 -->
      <div class="book-detail-content-wrapper">
        <div class="book-detail-content-title">{{$t('detail.navigation')}}</div>
        <div class="book-detail-content-list-wrapper">
          <div class="loading-text-wrapper" v-if="!this.navigation">
            <span class="loading-text">{{$t('detail.loading')}}</span>
          </div>
          <div class="book-detail-content-item-wrapper">
            <div class="book-detail-content-item" v-for="(item, index) in flatNavigation" :key="index"
              @click="read(item)">
              <div class="book-detail-content-navigation-text"
                :class="{'is-sub': item.deep> 1}"
                :style="itemStyle(item)"
                v-if="item.label">{{item.label}}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 书籍试读预览 -->
      <div class="book-detail-content-wrapper">
        <div class="book-detail-content-title">{{$t('detail.trial')}}</div>
        <div class="book-detail-content-list-wrapper">
          <div class="loading-text-wrapper" v-if="!this.displayed">
            <span class="loading-text">{{$t('detail.loading')}}</span>
          </div>
        </div>
        <div id="preview" v-show="this.displayed" ref="preview"></div>
      </div>
    </scroll>
    <!-- 底部导航 -->
    <div class="bottom-wrapper">
      <div class="bottom-btn" @click.stop.prevent="readBook()">{{$t('detail.read')}}</div>
      <div class="bottom-btn" @click.stop.prevent="trialListening()">{{$t('detail.listen')}}</div>
      <div class="bottom-btn" @click.stop.prevent="addOrRemoveShelf()">
        <span class="icon-check" v-if="inBookShelf"></span>
        {{inBookShelf ? $t('detail.isAddedToShelf') : $t('detail.addOrRemoveShelf')}}
      </div>
    </div>
    <toast :text="toastText" ref="toast"></toast>
  </div>
</template>

<script type="text/ecmascript-6">
import DetailTitle from '@/components/detail/detaiTitle'
import BookInfo from '@/components/detail/bookInfo'
import Scroll from '@/components/Scroll'
import Toast from '@/components/shelf/toast'
import { removeFromBookShelf, addToShelf } from '@/utils/book'
import { flatList, detail } from '@/api/book'
import { px2rem, realPx } from '@/utils/utils'
import { getLocalForage } from '@/utils/localForage'
import { getLocalStorage } from '@/utils/localStorage'
import Epub from 'epubjs'

global.ePub = Epub

export default {
  components: {
    DetailTitle,
    Scroll,
    BookInfo,
    Toast
  },
  computed: {
    // 书籍基本信息 - 详情
    desc () {
      if (this.description) {
        return this.description.substring(0, 100)
      } else {
        return ''
      }
    },
    // 书籍目录信息
    flatNavigation () {
      if (this.navigation) {
        return Array.prototype.concat.apply([], Array.prototype.concat.apply([], this.doFlatNavigation(this.navigation.toc)))
      } else {
        return []
      }
    },
    // 从书籍元数据信息中获取 - 语言
    lang () {
      return this.metadata ? this.metadata.language : '-'
    },
    // 从书籍元数据信息中获取 - 标识符ISBN
    isbn () {
      return this.metadata ? this.metadata.identifier : '-'
    },
    // 从书籍元数据信息中获取 - 出版社
    publisher () {
      return this.metadata ? this.metadata.publisher : '-'
    },
    // 从书籍元数据信息中获取 - 标题
    title () {
      return this.metadata ? this.metadata.title : ''
    },
    // 从书籍元数据信息中获取 - 作者
    author () {
      return this.metadata ? this.metadata.creator : ''
    },
    inBookShelf () {
      if (this.bookItem && this.bookShelf) {
        const flatShelf = (function flatten (arr) {
          return [].concat(...arr.map(v => v.itemList ? [v, ...flatten(v.itemList)] : v))
        })(this.bookShelf).filter(item => item.type === 1)
        const book = flatShelf.filter(item => item.fileName === this.bookItem.fileName)
        return book && book.length > 0
      } else {
        return false
      }
    }
  },
  data () {
    return {
      bookShelf: null, // 书架信息
      bookItem: null, // 书籍详情信息
      book: null, // 书籍 new Epub（）
      opf: null, // 书籍核心文件（OPF）完整路径
      cover: null, // 书籍封面
      metadata: null, // 元数据信息（metadata），包含：题名，责任者，语种，标识符等
      description: null, // 书籍 - desc
      categoryText: null, // 书籍 - 分类
      navigation: null, // 导航信息（章节）
      displayed: false, // 是否显示书籍预览
      toastText: '', // 提示文本
      audio: null,
      trialRead: null,
      randomLocation: null,
      trialText: null
    }
  },
  methods: {
    // 加入书架或者移出书架
    addOrRemoveShelf () {
      if (this.inBookShelf) {
        removeFromBookShelf(this.bookItem)
      } else {
        addToShelf(this.bookItem)
      }
      this.bookShelf = getLocalStorage('bookShelf')
    },
    // 显示提示
    showToast (text) {
      this.toastText = text
      this.$refs.toast.show()
    },
    // 底部导航 - 阅读
    readBook () {
      getLocalForage(this.bookItem.fileName, (err, value) => {
        if (!err && value instanceof Blob) {
          this.$router.push({
            path: `/ebook/${this.categoryText}|${this.bookItem.fileName}`
          })
        } else {
          // this.showToast(this.$t('shelf.downloadFirst'))
          this.$router.push({
            path: `/ebook/${this.categoryText}|${this.bookItem.fileName}`,
            query: {
              opf: this.opf
            }
          })
        }
      })
    },
    // 底部导航 - 听书
    trialListening () {
      getLocalForage(this.bookItem.fileName, (err, value) => {
        if (!err && value instanceof Blob) {
          this.$router.push({
            path: '/book-store/book-speaking',
            query: {
              fileName: this.bookItem.fileName
            }
          })
        } else {
          // this.showToast(this.$t('shelf.downloadFirst'))
          this.$router.push({
            path: '/book-store/book-speaking',
            query: {
              fileName: this.bookItem.fileName,
              opf: this.opf
            }
          })
        }
      })
    },
    // 目录 - 跳转到对应目录阅读
    read (item) {
      getLocalForage(this.bookItem.fileName, (err, value) => {
        if (!err && value instanceof Blob) {
          this.$router.push({
            path: `/ebook/${this.bookItem.fileName}`,
            query: {
              navigation: item.href
            }
          })
        } else {
          // this.showToast(this.$t('shelf.downloadFirst'))
          this.$router.push({
            path: `/ebook/${this.bookItem.fileName}`,
            query: {
              navigation: item.href,
              opf: this.opf
            }
          })
        }
      })
    },
    itemStyle (item) {
      return {
        marginLeft: (item.deep - 1) * px2rem(20) + 'rem'
      }
    },
    doFlatNavigation (content, deep = 1) {
      const arr = []
      content.forEach(item => {
        item.deep = deep
        arr.push(item)
        if (item.subitems && item.subitems.length > 0) {
          arr.push(this.doFlatNavigation(item.subitems, deep + 1))
        }
      })
      return arr
    },
    // 初始化书籍
    initBook () {
      if (this.bookItem) {
        getLocalForage(this.bookItem.fileName, (err, blob) => {
          if (err) {
            this.downloadBook()
          } else {
            if (blob) {
              this.parseBook(blob)
            } else {
              this.downloadBook()
            }
          }
        })
      }
    },
    init () {
      const fileName = this.$route.query.fileName
      this.categoryText = this.$route.query.category
      if (fileName) {
        detail({
          fileName: fileName
        }).then(response => {
          if (response.status === 200 && response.data.error_code === 0 && response.data.data) {
            const data = response.data.data
            console.log('书籍详情信息 data', data)
            this.bookItem = data
            this.cover = this.bookItem.cover // 书籍封面
            let rootFile = data.rootFile // 书籍核心文件（OPF）路径，示例：OEBPS/content.opf
            // startsWith() 方法用于检测字符串是否以指定的子字符串开始。如果是以指定的子字符串开头返回 true，否则 false。
            if (rootFile.startsWith('/')) {
              // substring() 方法用于提取字符串中介于两个指定下标之间的字符
              rootFile = rootFile.substring(1, rootFile.length)
            }
            // OPF文档是epub电子书的核心文件，且是一个标准的XML文件。详情可参考：https://www.cnblogs.com/diligenceday/p/4999315.html#_label2
            this.opf = `${process.env.VUE_APP_EPUB_OPF_URL}/${fileName}/${rootFile}` // 获取书籍核心文件（OPF）完整路径
            console.log('bookDetail opf', this.opf)
            this.parseBook(this.opf) // 解析书籍核心文件（OPF）
          } else {
            this.showToast(response.data.msg)
          }
        })
      }
      this.bookShelf = getLocalStorage('bookShelf')
    },
    // 下载书籍核心文件（OPF）
    downloadBook () {
      const opf = `${process.env.VUE_APP_EPUB_URL}/${this.bookItem.categoryText}/${this.bookItem.fileName}/OEBPS/package.opf`
      this.parseBook(opf)
    },
    // 解析书籍核心文件（OPF）
    parseBook (blob) {
      console.log('解析书籍：', blob)
      this.book = new Epub(blob)
      // 获取元数据信息（metadata），包含：题名，责任者，语种，标识符等
      this.book.loaded.metadata.then(metadata => {
        this.metadata = metadata
        console.log('书籍元数据信息：', this.metadata)
      })
      // 获取书籍导航信息（章节）
      this.book.loaded.navigation.then(nav => {
        this.navigation = nav
        console.log('书籍导航信息：', this.navigation)
        if (this.navigation.toc && this.navigation.toc.length > 1) {
          // 显示书籍（试读）
          const candisplay = this.display(this.navigation.toc[1].href)
          if (candisplay) {
            candisplay.then(section => {
              console.log('section', section)
              if (this.$refs.scroll) {
                this.$refs.scroll.refresh()
              }
              this.displayed = true
              const reg = new RegExp('<.+?>', 'g')
              const text = section.output.replace(reg, '').replace(/\s\s/g, '')
              this.description = text
            })
          }
        }
      })
    },
    // 显示书籍（试读）
    display (location) {
      console.log('书籍 location', location)
      console.log('书籍预览 refs', this.$refs.preview)
      if (this.$refs.preview) {
        if (!this.rendition) {
          console.log('渲染书籍')
          this.rendition = this.book.renderTo('preview', {
            width: window.innerWidth > 640 ? 640 : window.innerWidth,
            height: window.innerHeight,
            method: 'default'
          })
        }
        console.log('书籍预览 rendition', this.rendition)
        if (!location) {
          return this.rendition.display()
        } else {
          return this.rendition.display(location)
        }
      }
    },
    findBookFromList (fileName) {
      flatList().then(response => {
        if (response.status === 200) {
          const bookList = response.data.data.filter(item => item.fileName === fileName)
          if (bookList && bookList.length > 0) {
            this.bookItem = bookList[0]
            console.log(this.bookItem)
            this.initBook()
          }
        }
      })
    },
    back () {
      this.$router.go(-1)
    },
    onScroll (offsetY) {
      if (offsetY > realPx(42)) {
        this.$refs.title.showShadow()
      } else {
        this.$refs.title.hideShadow()
      }
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-detail {
    width: 100%;
    background: white;
    .content-wrapper {
      width: 100%;
      .book-detail-content-wrapper {
        width: 100%;
        border-bottom: px2rem(1) solid #eee;
        box-sizing: border-box;
        .book-detail-content-title {
          font-size: px2rem(20);
          font-weight: bold;
          padding: px2rem(20) px2rem(15) px2rem(10) px2rem(15);
          box-sizing: border-box;
        }
        .book-detail-content-list-wrapper {
          padding: px2rem(10) px2rem(15);
          box-sizing: border-box;
          .loading-text-wrapper {
            width: 100%;
            .loading-text {
              font-size: px2rem(14);
              color: #666;
            }
          }
          .book-detail-content-row {
            display: flex;
            box-sizing: border-box;
            margin-bottom: px2rem(10);
            .book-detail-content-label {
              flex: 0 0 px2rem(70);
              font-size: px2rem(14);
              color: #666;
            }
            .book-detail-content-text {
              flex: 1;
              font-size: px2rem(14);
              color: #333;
            }
          }
          #preview {
          }
          .book-detail-content-item-wrapper {
            .book-detail-content-item {
              padding: px2rem(15) 0;
              font-size: px2rem(14);
              line-height: px2rem(16);
              color: #666;
              border-bottom: px2rem(1) solid #eee;
              &:last-child {
                border-bottom: none;
              }
              .book-detail-content-navigation-text {
                width: 100%;
                @include ellipsis;
                &.is-sub {
                  color: #666;
                }
              }
            }
          }
        }
      }
      .audio-wrapper {
        width: 100%;
        padding: px2rem(15);
        box-sizing: border-box;
        #audio {
          width: 100%;
        }
      }
    }
    .bottom-wrapper {
      position: fixed;
      bottom: 0;
      left: 0;
      z-index: 120;
      display: flex;
      width: 100%;
      height: px2rem(52);
      box-shadow: 0 px2rem(-2) px2rem(2) rgba(0, 0, 0, .1);
      .bottom-btn {
        flex: 1;
        color: $color-blue;
        font-weight: bold;
        font-size: px2rem(14);
        @include center;
        &:active {
          color: $color-blue-transparent;
        }
        .icon-check {
          margin-right: px2rem(5);
        }
      }
      &.hide-shadow {
        box-shadow: none;
      }
    }
  }
</style>
