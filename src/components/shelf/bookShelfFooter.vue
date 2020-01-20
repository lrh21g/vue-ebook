<template>
  <div class="book-shelf-footer">
    <div class="book-shelf-tab-wrapper"
      v-for="(item, index) in tabs" :key="index"
      @click="onTabClick(item)">
      <div class="book-shelf-tab">
        <!-- 私密阅读 - 开启私密阅读 icon -->
        <div v-if="item.index === 1 && !isPrivate"
          class="icon-private tab-icon" :class="{'is-selected': isSelected}" ></div>
        <!-- 私密阅读 - 关闭私密阅读 icon -->
        <div v-if="item.index === 1 && isPrivate"
          class="icon-private-see tab-icon" :class="{'is-selected': isSelected}"></div>
        <!-- 开启离线 - 开启离线 icon -->
        <div v-if="item.index === 2 && !isDownload"
          class="icon-download tab-icon" :class="{'is-selected': isSelected}"></div>
        <!-- 开启离线 - 关闭离线 icon -->
        <div v-if="item.index === 2 && isDownload"
          class="icon-download-remove tab-icon" :class="{'is-selected': isSelected}"></div>
        <!-- 移动到... icon -->
        <div v-if="item.index === 3"
          class="icon-move tab-icon" :class="{'is-selected': isSelected}"></div>
        <!-- 移出书架 icon -->
        <div v-if="item.index === 4"
          class="icon-shelf tab-icon" :class="{'is-selected': isSelected}"></div>
        <div class="tab-text"
          :class="{'remove-text': item.index === 4, 'is-selected': isSelected}">{{label(item)}}</div>
      </div>
    </div>
    <popup ref="popup"
      :title="popTitle"
      :confirmText="confirmText"
      :isRemoveText="isRemoveText"
      :cancelText="$t('shelf.cancel')"
      @confirm="onConfirm"></popup>
    <shelf-group-dialog :visible.sync="ifGroupDialogShow"
      :data="data"
      :bookList="bookList"
      :category="category"
      :isInGroup="isInGroup"
      @group="groupEdit"></shelf-group-dialog>
  </div>
</template>

<script>
import Popup from '@/components/shelf/popup'
import ShelfGroupDialog from '@/components/shelf/shelfGroupDialog'

export default {
  name: 'bookShelfFooter',
  components: {
    Popup, ShelfGroupDialog
  },
  props: {
    data: Array,
    isInGroup: Boolean,
    bookList: Array,
    category: Object
  },
  data () {
    return {
      popTitle: '',
      confirmText: '',
      isRemoveText: false,
      ifShowPopup: false,
      ifGroupDialogShow: false,
      onConfirm: function () {}
    }
  },
  computed: {
    // 已选择书籍
    selectedBooks () {
      const selectedBooks = []
      this.data.forEach(item => {
        if (item.selected) {
          selectedBooks.push(item)
        }
      })
      return selectedBooks
    },
    // 是存在已选择书籍
    isSelected () {
      if (this.data) {
        // some() 方法用于检测数组中的元素是否满足指定条件
        // >>> 如果有一个元素满足条件，则表达式返回true , 剩余的元素不会再执行检测。
        // >>> 如果没有满足条件的元素，则返回false。
        return this.data.some(item => item.selected)
      } else {
        return false
      }
    },
    // 在已选择书籍中，是否存在有私密阅读
    isPrivate () {
      if (!this.isSelected) {
        return false
      } else {
        // every() 方法用于检测数组所有元素是否都符合指定条件
        // >>> 如果数组中检测到有一个元素不满足，则整个表达式返回 false ，且剩余的元素不会再进行检测。
        // >>> 如果所有元素都满足条件，则返回 true。
        return this.data.every(item => {
          if (item.selected) {
            return item.private
          } else {
            return true
          }
        })
      }
    },
    // 在已选择书籍中，是否存在已缓存的书籍
    isDownload () {
      if (!this.isSelected) {
        return false
      } else {
        return this.data.every(item => {
          if (item.selected) {
            return item.cache
          } else {
            return true
          }
        })
      }
    },
    // tab标签文本
    tabs () {
      return [
        {
          label: this.$t('shelf.private'), // 私密阅读
          label2: this.$t('shelf.noPrivate'), // 关闭私密阅读
          index: 1
        },
        {
          label: this.$t('shelf.download'), // 开启离线
          label2: this.$t('shelf.delete'), // 删除
          index: 2
        },
        {
          label: this.$t('shelf.move'), // 移动到
          index: 3
        },
        {
          label: this.$t('shelf.remove'), // 移出书架
          index: 4
        }
      ]
    }
  },
  methods: {
    // tab 底部显示文本：1:私密阅读，2:开启离线/删除，3:移动到..., 4: 移出书架
    label (item) {
      switch (item.index) {
        case 1:
          return this.isPrivate ? item.label2 : item.label
        case 2:
          return this.isDownload ? item.label2 : item.label
        default:
          return item.label
      }
    },
    // 设置私密阅读
    onSetPrivate () {
      this.$emit('setPrivate', true)
    },
    // 关闭私密阅读
    onCancelPrivate () {
      this.$emit('setPrivate', false)
    },
    // 设置书籍缓存
    onSetDownload () {
      this.$emit('setDownload', true)
    },
    // 删除书籍缓存
    onRemoveDownload () {
      this.$emit('setDownload', false)
    },
    // 将书籍移出书架
    removeBook () {
      this.$emit('removeBook')
    },
    // 底部tab 点击
    onTabClick (item) {
      if (item.index === 1) {
        this.showPrivate() // 私密阅读
      } else if (item.index === 2) {
        this.showDownload() // 开启离线/删除
      } else if (item.index === 3) {
        this.showGroupDialog() // 移动到...
      } else if (item.index === 4) {
        this.showRemove() // 显示移出书架确认弹出层
      }
    },
    // 显示 私密阅读/关闭私密 确认弹出层
    showPrivate () {
      if (this.isSelected) {
        if (!this.isPrivate) {
          this.showPopup(this.$t('shelf.setPrivateTitle'), this.$t('shelf.open'), this.onSetPrivate)
        } else {
          this.showPopup(this.$t('shelf.closePrivateTitle'), this.$t('shelf.close'), this.onCancelPrivate)
        }
      }
    },
    // 显示 开启离线/删除离线 确认弹出层
    showDownload () {
      if (this.isSelected) {
        if (!this.isDownload) {
          this.showPopup(this.$t('shelf.setDownloadTitle'), this.$t('shelf.open'), this.onSetDownload)
        } else {
          this.showPopup(this.$t('shelf.removeDownloadTitle'), this.$t('shelf.delete'), this.onRemoveDownload, true)
        }
      }
    },
    // 显示 移出书架 确认弹出层
    showRemove () {
      if (this.isSelected) {
        let msg
        if (this.selectedBooks.length === 1) {
          msg = this.$t('shelf.removeBookTitle').replace('$1', '《' + this.selectedBooks[0].title + '》')
        } else {
          msg = this.$t('shelf.removeBookTitle').replace('$1', this.$t('shelf.selectedBooks'))
        }
        this.showPopup(msg, this.$t('shelf.removeBook'), this.removeBook, true)
      }
    },
    // 显示分组弹窗（移动书籍）
    showGroupDialog () {
      if (this.isSelected) {
        this.ifGroupDialogShow = true
      }
    },
    // 书籍分组编辑
    groupEdit (operation, group) {
      this.$emit('groupEdit', operation, group)
    },
    // 显示弹出层
    showPopup (title, confirmText, onConfirm, isRemoveText = false) {
      this.popTitle = title
      this.confirmText = confirmText
      this.onConfirm = onConfirm
      this.isRemoveText = isRemoveText
      this.$refs.popup.show()
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-shelf-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 120;
    display: flex;
    width: 100%;
    height: px2rem(48);
    background: white;
    box-shadow: 0 px2rem(-2) px2rem(4) 0 rgba(0, 0, 0, .1);
    .book-shelf-tab-wrapper {
      flex: 1;
      width: 25%;
      height: 100%;
      .book-shelf-tab {
        width: 100%;
        height: 100%;
        @include columnCenter;
        .tab-icon {
          font-size: px2rem(20);
          color: #666;
          opacity: .5;
          &.icon-shelf {
            color: $color-pink;
          }
          &.icon-download {
            font-size: px2rem(22);
          }
          &.is-selected {
            opacity: 1;
          }
        }
        .tab-text {
          margin-top: px2rem(5);
          font-size: px2rem(12);
          color: #666;
          opacity: .5;
          &.remove-text {
            color: $color-pink;
          }
          &.is-selected {
            opacity: 1;
          }
        }
      }
    }
  }
</style>
