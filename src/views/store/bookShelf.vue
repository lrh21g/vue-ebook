<template>
  <div class="book-shelf">
    <shelf-title class="shelf-title"
      :title="$t('shelf.title')"
      :isEditMode.sync="isEditMode"
      :data="bookList"
      :ifShowBack="ifShowBack"
      :ifShowClear="ifShowClear"
      @onEditClick="onEditClick"
      @clearCache="clearCache"
      ref="shelfTitle"
      v-show="ifShowTitle"></shelf-title>
    <scroll-view class="book-shelf-scroll-wrapper"
      :top="0"
      :bottom="scrollBottom"
      :initPosition="initPosition"
      @onScroll="onScroll"
      ref="scroll">
      <shelf-search @onSearchClick="onSearchClick"
        @onCancel="onSearchCancel"
        @onTabClick="onSearchTabClick"
        ref="shelfSearch"
        v-if="!isDataEmpty"></shelf-search>
      <book-shelf class="book-shelf-list"
        :data="bookList"
        :showType="showType"
        :isEditMode="isEditMode"
        @onBookClick="onBookClick"
        ref="bookShelf"
        v-if="!isDataEmpty"></book-shelf>
      <book-shelf-empty
        class="book-shelf-empty"
        v-if="isDataEmpty"></book-shelf-empty>
    </scroll-view>
    <book-shelf-footer class="book-shelf-footer"
      :data="bookList"
      :bookList="bookList"
      :isInGroup="false"
      @setPrivate="setPrivate"
      @setDownload="setDownload"
      @removeBook="removeBook"
      @groupEdit="groupEdit"
      v-show="isEditMode"></book-shelf-footer>
    <toast :text="toastText" ref="toast"></toast>
  </div>
</template>

<script type="text/ecmascript-6">
import ShelfTitle from '@/components/shelf/shelfTitle'
import ShelfSearch from '@/components/shelf/shelfSearch'
import BookShelf from '@/components/shelf/shelf'
import ScrollView from '@/components/Scroll'
import BookShelfFooter from '@/components/shelf/bookShelfFooter'
import BookShelfEmpty from '@/components/shelf/bookShelfEmpty'
import Toast from '@/components/shelf/toast'
import { shelf, download } from '@/api/book'
import { getLocalStorage, setLocalStorage, clearLocalStorage } from '@/utils/localStorage'
import { getLocalForage, clearLocalForage } from '@/utils/localForage'
import { removeBookCache } from '@/utils/book'
import Epub from 'epubjs'
import { realPx } from '@/utils/utils'

global.ePub = Epub
const BOOK_SHELF_KEY = 'bookShelf'

export default {
  // name: 'bookShelf',
  components: {
    ShelfTitle, ShelfSearch, BookShelf, ScrollView, BookShelfFooter, BookShelfEmpty, Toast
  },
  data () {
    return {
      bookList: [], // 书籍列表(其中，item.type --- 1: 单个书籍，2: 书籍分组)
      ifShowTitle: true, // 是否显示标题
      isEditMode: false, // 是否编辑
      ifShowBack: false, // 是否显示返回
      ifShowClear: true, // 是否显示清除缓存
      showType: 0, // 书籍排序类型：1:默认，2:按进度，3:按购买  0:未进行排序显示
      scrollBottom: 0, // 滚动区域距离底部的距离
      toastText: '', // 提示文本
      initPosition: {
        x: 0,
        y: 0
      }
    }
  },
  computed: {
    isDataEmpty () {
      return !this.bookList || this.bookList.filter(item => item.type !== 3).length === 0
    }
  },
  mounted () {
    this.getBookShelf()
  },
  methods: {
    onEditClick (v) {
      // 编辑 / 取消
      this.isEditMode = v
      if (!this.isEditMode) {
        // 取消编辑 - 将书籍选择置为false
        this.bookList.forEach(item => {
          if (item.bookId) {
            item.selected = false
          } else if (item.itemList) {
            item.itemList.forEach(subItem => {
              subItem.selected = false
            })
          }
        })
      }
      if (this.isEditMode) {
        // 编辑书架 - 设置滚动区域距离底部距离
        this.scrollBottom = 48
        this.$nextTick(() => {
          if (this.$refs.scroll) {
            this.$refs.scroll.refresh()
          }
        })
      } else {
        // 取消编辑 - 设置滚动区域距离底部距离
        this.scrollBottom = 0
        this.$nextTick(() => {
          if (this.$refs.scroll) {
            this.$refs.scroll.refresh()
          }
        })
      }
    },
    // 清除缓存
    clearCache () {
      clearLocalStorage()
      clearLocalForage(() => {
        console.log('清除localForage成功...')
        this.getBookShelf() // 获取书架信息
      })
      this.showToast(this.$t('shelf.clearCacheSuccess'))
    },
    // 搜索栏 - 搜索输入框点击
    onSearchClick () {
      this.onEditClick(false)
      this.showType = 1
      this.hideTitle()
    },
    // 搜索栏 - 取消搜索
    onSearchCancel () {
      this.showTitle()
      this.showType = 0
      this.$refs.scroll.scrollTo(0, 0)
    },
    // 搜索栏 - tab点击，排序类型：1:默认，2:按进度，3:按购买
    onSearchTabClick (id) {
      this.showType = id
    },
    // 显示书架头部title
    showTitle () {
      this.ifShowTitle = true
    },
    // 隐藏书架头部title
    hideTitle () {
      this.ifShowTitle = false
    },
    // 滚动区域 - 监听滚动
    onScroll (offsetY) {
      if (offsetY > realPx(54)) {
        this.$refs.shelfTitle.showShadow() // 书架头部title显示阴影
        if (!this.ifShowTitle) {
          // 书架头部隐藏，即处于搜素状态
          this.$refs.shelfSearch.showShadow() // 书架搜索栏显示阴影
        }
      } else {
        this.$refs.shelfTitle.hideShadow() // 书架头部title隐藏阴影
        if (this.$refs.shelfSearch) {
          this.$refs.shelfSearch.hideShadow() // 书架搜索栏隐藏阴影
        }
      }
    },
    // 书架书籍列表 - 书籍点击
    onBookClick (item, index) {
      this.$router.push({
        path: '/book-store/detail',
        query: {
          fileName: item.fileName,
          category: item.categoryText
        }
      })
    },
    // 设置私密阅读 v - true为设置私密阅读，false为关闭私密阅读
    setPrivate (v) {
      this.bookList.forEach(item => {
        if (item.selected) {
          item.private = v
        }
      }) // 遍历书籍列表中已选书籍，修改书籍私密阅读状态
      this.onEditClick(false) // 取消编辑状态
      this.saveBookShelfToLocalStorage() // 缓存至本地
      if (v) {
        this.showToast(this.$t('shelf.setPrivateSuccess')) // 显示提示：已开启私密阅读<br>阅读记录将不再公
      } else {
        this.showToast(this.$t('shelf.closePrivateSuccess')) // 显示提示：已关闭私密阅读
      }
    },
    // 设置离线阅读 - 下载书籍 needDownload - true为设置离线阅读，false为删除离线阅读
    async setDownload (needDownload) {
      this.showContinueToast(this.$t('shelf.startDownload')) // 持续显示提示：开始下载
      for (let i = 0; i < this.bookList.length; i++) {
        const item = this.bookList[i]
        if (needDownload && item.selected) {
          // 需要设置书籍为离线阅读，并且该书籍为已选状态，则开始下载该书籍，并设置书籍缓存标识
          await this.downloadBook(item).then(() => {
            item.cache = needDownload
          })
        } else if (!needDownload && item.selected) {
          // 需要删除书籍缓存，并且该书籍为已选状态，则删除书籍缓存，并设置书籍缓存标识
          await this.removeDownloadBook(item).then(() => {
            item.cache = needDownload
          })
        }
        // 设置书籍分组中的书籍缓存
        if (item.itemList) {
          for (let i = 0; i < item.itemList.length; i++) {
            await this.downloadItem(item.itemList[i], needDownload)
          }
        }
      }
      this.hideToast()
      if (needDownload) {
        this.showToast(this.$t('shelf.setDownloadSuccess')) // 显示提示：已开启，将自动离线已购内容
      } else {
        this.showToast(this.$t('shelf.removeDownloadSuccess')) // 显示提示：已选书籍的离线内容已删除
      }
      this.onEditClick(false)
      this.saveBookShelfToLocalStorage()
      console.log('数据保存成功...')
    },
    // 缓存书籍分组中书籍
    async downloadItem (subItem, needDownload) {
      if (needDownload && subItem.selected) {
        await this.downloadBook(subItem).then(() => {
          subItem.cache = needDownload
        })
      } else if (!needDownload && subItem.selected) {
        await this.removeDownloadBook(subItem).then(() => {
          subItem.cache = needDownload
        })
      }
    },
    // 持续显示提示
    showContinueToast (text) {
      this.toastText = text
      this.$refs.toast.continueShow()
    },
    // 删除离线阅读书籍
    removeDownloadBook (item) {
      return removeBookCache(item.fileName)
    },
    // 下载书籍
    downloadBook (item) {
      return new Promise((resolve, reject) => {
        // 获取indexedDB中对应书籍的缓存，如果找不到，则进行书籍缓存
        getLocalForage(item.fileName, (err, value) => {
          if (!err && value instanceof Blob) {
            console.log(`[${item.fileName}]读取成功...`, value, new Epub(value))
            resolve()
          } else {
            download(item, item => {
              console.log('[' + item.fileName + ']下载成功...')
              resolve()
            }, reject, reject, progressEvent => {
              // 下载进度提示
              const progress = Math.floor(progressEvent.loaded / progressEvent.total * 100) + '%'
              this.toastText = this.$t('shelf.progressDownload').replace('$1', `${item.fileName}.epub(${progress})`)
            })
          }
        })
      })
    },
    // 移除书架
    removeBook () {
      // 遍历书籍列表以及书籍分组中书籍的选择状态
      this.bookList = this.bookList.filter(item => {
        if (item.itemList) {
          item.itemList = item.itemList.filter(subItem => {
            return !subItem.selected
          })
        }
        return !item.selected
      })
      // this.$refs.bookShelf.showRemoveAnimation()
      this.onEditClick(false) // 取消编辑状态
      this.saveBookShelfToLocalStorage() // 缓存至本地
    },
    // 书籍分组编辑
    // >>> operation - 操作类型：1:移到分组，2:新建分组，3:移出分组
    // >>> group - 分组信息
    groupEdit (operation, group) {
      switch (operation) {
        case 1:
          this.moveToGroup(group) // 移到分组
          break
        case 2:
          this.newGroup(group) // 新建分组
          this.moveToGroup(group)
          break
        case 3:
          this.moveOutGroup() // 移出分组
          break
      }
    },
    // 书籍分组编辑 - 新建分组
    newGroup (group) {
      this.clearAddFromBookList()
      this.bookList.push(group)
      this.appendAddToBookList()
    },
    // 书籍分组编辑 - 移到分组
    moveToGroup (group) {
      const selectedBooks = this.getSelectedBooks() // 获取已选择书籍
      this.clearSelectedBooks()
      if (group && group.itemList) {
        group.itemList = [...group.itemList, ...selectedBooks]
        group.itemList.forEach((item, index) => {
          item.id = index + 1
        })
      }
      this.onEditClick(false) // 取消编辑状态
      this.saveBookShelfToLocalStorage() // 缓存至本地
      this.showToast(this.$t('shelf.moveBookInSuccess').replace('$1', group.title)) // 显示提示：成功移入xxx
    },
    // 书籍分组编辑 - 移出分组
    moveOutGroup () {
      this.clearAddFromBookList()
      const selectedBooks = this.getSelectedBooks()
      this.clearSelectedBooks()
      this.appendBookToList(selectedBooks)
      this.appendAddToBookList()
      this.onEditClick(false) // 取消编辑
      this.saveBookShelfToLocalStorage() // 添加至缓存
      this.showToast(this.$t('shelf.moveBookOutSuccess')) // 显示提示：成功移出分组
    },
    clearAddFromBookList () {
      this.bookList = this.bookList.filter(item => {
        return item.type !== 3
      })
    },
    // 添加到书籍列表
    appendBookToList (selectedBooks) {
      let id = this.bookList[this.bookList.length - 1].id + 1
      selectedBooks.forEach(item => {
        item.id = id++
        this.bookList.push(item)
      })
    },
    appendAddToBookList () {
      this.bookList.push({
        cover: '',
        title: '',
        type: 3,
        // id: this.bookList[this.bookList.length - 1].id + 1
        id: Number.MAX_SAFE_INTEGER // Number.MAX_SAFE_INTEGER 常量表示在 JavaScript 中最大的安全整数
      })
    },
    // 获取选择的书籍
    getSelectedBooks () {
      const selectedBooks = this.bookList.filter(item => {
        return item.selected
      })
      this.bookList.filter(item => {
        if (item.type === 2 && item.itemList) {
          item.itemList.filter(subItem => {
            if (subItem.selected) {
              selectedBooks.push(subItem)
            }
          })
        }
      })
      return selectedBooks
    },
    // 清除选择的书籍
    clearSelectedBooks () {
      this.bookList = this.bookList.filter(item => {
        return !item.selected
      })
      this.bookList.forEach(item => {
        if (item.type === 2 && item.itemList) {
          item.itemList = item.itemList.filter(subItem => {
            return !subItem.selected
          })
        }
      })
    },
    showToast (text) {
      this.toastText = text
      this.$refs.toast.show()
    },
    hideToast () {
      this.$refs.toast.hide()
    },
    // 获取书架信息
    getBookShelf () {
      this.bookList = this.getBookShelfFromLocalStorage()
      console.log('书架信息 缓存', this.bookList)
      if (!this.bookList) {
        shelf().then(response => {
          this.bookList = response.data.bookList
          if (!this.bookList) {
            this.bookList = []
          }
          this.appendAddToBookList()
          this.saveBookShelfToLocalStorage()
          this.initBookShelf()
          console.log('书架列表 请求数据', this.bookList)
        })
      } else {
        this.initBookShelf()
      }
    },
    // 初始化书架 - 将书架中书籍的选择初始化为 false
    initBookShelf () {
      if (this.bookList) {
        this.bookList.forEach(item => {
          item.selected = false
        })
      }
    },
    saveBookShelfToLocalStorage () {
      setLocalStorage(BOOK_SHELF_KEY, this.bookList)
    },
    getBookShelfFromLocalStorage () {
      return getLocalStorage(BOOK_SHELF_KEY)
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-shelf {
    position: relative;
    z-index: 100;
    width: 100%;
    height: 100%;
    font-size: 0;
    .shelf-title {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 110;
    }
    .book-shelf-list {
      position: absolute;
      top: px2rem(93.5);
      left: 0;
      z-index: 100;
    }
    .book-shelf-empty {
      position: absolute;
      top: px2rem(42);
      left: 0;
      z-index: 100;
    }
    .book-shelf-scroll-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 101;
      background: white;
    }
    .book-shelf-scroll-wrapper2 {
      position: absolute;
      top: px2rem(93.5);
      left: 0;
      z-index: 101;
    }
  }
</style>
