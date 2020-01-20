<template>
  <div class="book-shelf-wrapper">
    <!-- 未进入搜索状态(showType: 0) 或 进入搜索状态，排序为默认(showType: 1) -->
    <!-- item.type: 1 - 单个书籍， 2 - 书籍分组， 3 - 添加书籍Icon -->
    <transition-group name="list" tag="div" id="book-shelf-list"
      v-if="showType === 0 || showType === 1">
      <div class="book-shelf-item"
        v-for="(item, index) in bookData" :key="item.id"
        @click="onBookClick(item, index)">
        <div class="book-img-wrapper"
          :class="{'add-book': item.type === 3, 'category-book': item.type ===2}" ref="bookImg">
          <!-- 单个书籍 item.type = 1 -->
          <shelf-image :data="item" :isEditMode="isEditMode" v-if="item.type === 1"></shelf-image>
          <!-- 书籍分组 item.type = 2 -->
          <shelf-category :data="item" :isEditMode="isEditMode" v-else-if="item.type === 2"></shelf-category>
          <!-- 添加书籍Icon -->
          <span class="icon-add icon" v-else></span>
        </div>
        <div class="book-title-wrapper">
          <span class="book-title title-small">{{item.title}}</span>
        </div>
      </div>
    </transition-group>
    <!-- 进入搜索状态, 排序为按进度(showType: 2), 按购买(showType: 3) -->
    <div class="book-shelf-label-list-wrapper" v-if="showType === 2 || showType === 3">
      <div class="book-shelf-list-wrapper" ref="bookShelfList"
        v-for="(item, index) in purchaseData" :key="index">
        <div class="book-shelf-label-item" :class="{'is-fixed': item.isFixed}">
          <span class="book-shelf-label-text">{{item.label}}</span>
        </div>
        <div class="book-shelf-item-wrapper">
          <div class="book-shelf-item"
            v-for="(subItem, subIndex) in item.bookList" :key="subItem.id"
            @click="onBookClick(subItem, subIndex)">
            <div class="book-img-wrapper"
              :class="{'add-book': subItem.type === 3, 'category-book': subItem.type ===2}"
              ref="bookImg">
              <!-- 单个书籍 item.type = 1 -->
              <shelf-image :data="subItem" :isEditMode="isEditMode" v-if="subItem.type === 1"></shelf-image>
              <!-- 书籍分组 item.type = 2 -->
              <shelf-category :data="subItem" :isEditMode="isEditMode" v-else-if="subItem.type === 2"></shelf-category>
              <!-- 添加书籍Icon -->
              <span class="icon-add icon" v-else></span>
            </div>
            <div class="book-title-wrapper">
              <span class="book-title title-small">{{subItem.title}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="book-shelf-statistics" v-show="showType === 0">
      {{$t('shelf.statistic').replace('$1', publicNumber).replace('$2', privateNumber)}}
    </div>
  </div>
</template>

<script>
import ShelfCategory from '@/components/shelf/shelfCategory'
import ShelfImage from '@/components/shelf/shelfImage'
import { realPx } from '@/utils/utils'
import { flatBookList } from '@/utils/book'

export default {
  name: 'shelf',
  components: {
    ShelfCategory,
    ShelfImage
  },
  props: {
    data: Array, // 书籍信息
    isEditMode: Boolean, // 是否进入编辑状态
    showType: { // 显示类型
      type: Number,
      default: 0
    }
  },
  computed: {
    bookData () {
      let data = null
      if (this.showType === 0) {
        data = this.data
      } else if (this.showType === 1) {
        data = flatBookList(this.data)
      }
      return data
    },
    publicNumber () {
      if (this.data) {
        let number = 0
        this.data.filter(item => {
          if (!item.private && item.type === 1) {
            number++
          } else if (item.type === 2 && item.itemList.length > 0) {
            number += item.itemList.filter(subItem => {
              return !subItem.private && subItem.type === 1
            }).length
          }
        })
        return number
      } else {
        return 0
      }
    },
    privateNumber () {
      if (this.data) {
        let number = 0
        this.data.filter(item => {
          if (item.private && item.type === 1) {
            number++
          } else if (item.type === 2 && item.itemList.length > 0) {
            number += item.itemList.filter(subItem => {
              return subItem.private && subItem.type === 1
            }).length
          }
        })
        return number
      } else {
        return 0
      }
    },
    // 书籍购买数据
    purchaseData () {
      const bought = {
        label: this.$t('shelf.bought'), // 已购买
        bookList: flatBookList(this.data).filter(item => item.cache),
        // bookList: this.flatData.filter(item => item.cache),
        isFixed: false
      }
      const notPurchased = {
        label: this.$t('shelf.notPurchased'), // 未购买
        bookList: flatBookList(this.data).filter(item => !item.cache),
        // bookList: this.flatData.filter(item => !item.cache),
        isFixed: false
      }
      return [bought, notPurchased]
    },
    // 获取已购买书籍列表的高度
    bookShelfList () {
      // Element.getBoundingClientRect()方法返回元素的大小及其相对于视口的位置
      return this.$refs.bookShelfList[0].getBoundingClientRect().height
    },
    // 获取未购买书籍列表的高度
    bookShelfList2 () {
      return this.$refs.bookShelfList[1].getBoundingClientRect().height
    }
  },
  methods: {
    // 固定已购买书籍列表title或未购买书籍列表title
    fixTitle (offsetY) {
      if (this.showType === 2 || this.showType === 3) {
        if (offsetY > realPx(10) && offsetY < this.bookShelfList) {
          if (this.purchaseData[0].isFixed === false) {
            this.purchaseData[0].isFixed = true
            this.purchaseData[1].isFixed = false
            this.$forceUpdate()
          }
        } else if (offsetY >= this.bookShelfList - realPx(42)) {
          if (this.purchaseData[1].isFixed === false) {
            this.purchaseData[0].isFixed = false
            this.purchaseData[1].isFixed = true
            this.$forceUpdate()
          }
        } else {
          this.purchaseData[0].isFixed = false
          this.purchaseData[1].isFixed = false
          this.$forceUpdate()
        }
      }
    },
    // 书籍点击
    // item.type: 1 - 单个书籍， 2 - 书籍分组， 3 - 添加书籍Icon
    onBookClick (item, index) {
      if (item.type === 3) {
        this.$router.push('/book-store/home')
      } else if (item.type === 1) {
        if (this.isEditMode) {
          item.selected = !item.selected
        } else {
          this.$emit('onBookClick', item, index)
        }
      } else if (item.type === 2) {
        if (!this.isEditMode) {
          this.$router.push({
            path: '/book-store/category',
            query: {
              index: index
            }
          })
        }
      }
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-shelf-wrapper {
    width: 100%;
    overflow: auto;
    font-size: 0;
    #book-shelf-list {
      display: flex;
      flex-flow: row wrap;
      width: 100%;
      padding: 0 px2rem(15);
      box-sizing: border-box;
      .book-shelf-item {
        flex: 0 0 33.33%;
        width: 33.33%;
        padding: px2rem(15);
        box-sizing: border-box;
        &.list-move {
          transition: transform .5s;
        }
        &.list-leave-active {
          display: none;
        }
        .book-img-wrapper {
          width: 100%;
          @include shelfImgHeight;
          box-shadow: px2rem(2) px2rem(2) px2rem(6) px2rem(2) rgba(200, 200, 200, .3);
          @include center;
          border: px2rem(1) solid #eee;
          box-sizing: border-box;
          &.add-book {
            box-shadow: none;
            border: px2rem(1) solid #ccc;
            box-sizing: border-box;
          }
          &.category-book {
            border: px2rem(1) solid #eee;
            box-sizing: border-box;
          }
          .book-img {
            width: 100%;
            height: 100%;
          }
          .icon-add {
            font-size: px2rem(40);
            color: #ccc;
          }
        }
        .book-title-wrapper {
          .book-title {
            margin-top: px2rem(10);
          }
        }
      }
    }
    .book-shelf-statistics {
      margin: px2rem(30) 0 px2rem(20) 0;
      text-align: center;
      font-size: px2rem(12);
      color: #999;
    }
    .book-shelf-label-list-wrapper {
      width: 100%;
      .book-shelf-list-wrapper {
        position: relative;
        width: 100%;
        .book-shelf-label-item {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 120;
          width: 100%;
          height: px2rem(42);
          border-top: px2rem(1) solid #eee;
          border-bottom: none;
          box-sizing: border-box;
          background: white;
          &.is-fixed {
            position: fixed;
            top: px2rem(93);
            left: 0;
            border-bottom: px2rem(1) solid #eee;
          }
          @include left;
          .book-shelf-label-text {
            font-size: px2rem(14);
            color: #666;
            margin: 0 px2rem(15);
          }
        }
        .book-shelf-item-wrapper {
          position: relative;
          z-index: 110;
          display: flex;
          flex-flow: row wrap;
          width: 100%;
          padding: px2rem(42) px2rem(15) 0 px2rem(15);
          box-sizing: border-box;
          .book-shelf-item {
            flex: 0 0 33.33%;
            width: 33.33%;
            padding: px2rem(15);
            box-sizing: border-box;
            &.list-move {
              transition: transform .5s;
            }
            &.list-leave-active {
              display: none;
            }
            .book-img-wrapper {
              width: 100%;
              @include shelfImgHeight;
              box-shadow: px2rem(2) px2rem(2) px2rem(6) px2rem(2) rgba(200, 200, 200, .3);
              @include center;
              border: px2rem(1) solid #eee;
              box-sizing: border-box;
              &.add-book {
                box-shadow: none;
                border: px2rem(1) solid #ccc;
                box-sizing: border-box;
              }
              &.category-book {
                border: px2rem(1) solid #eee;
                box-sizing: border-box;
              }
              .book-img {
                width: 100%;
                height: 100%;
              }
              .icon-add {
                font-size: px2rem(40);
                color: #ccc;
              }
            }
            .book-title-wrapper {
              .book-title {
                margin-top: px2rem(10);
              }
            }
          }
        }
      }
    }
  }
</style>
