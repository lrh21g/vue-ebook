<template>
  <div class="ebook"  ref="ebookView">
    <ebook-bookmark></ebook-bookmark>
    <ebook-title></ebook-title>
    <ebook-reader></ebook-reader>
    <ebook-menu></ebook-menu>
  </div>
</template>

<script>
import EbookReader from '../../components/ebook/EbookReader'
import EbookTitle from '../../components/ebook/EbookTitle'
import EbookMenu from '../../components/ebook/EbookMenu'
import EbookBookmark from '../../components/ebook/EbookBookmark'
import { ebookMixin } from '@/utils/mixin'
import { getReadTime, saveReadTime } from '../../utils/localStorage'

export default {
  mixins: [ebookMixin],
  components: {
    EbookReader,
    EbookTitle,
    EbookMenu,
    EbookBookmark
  },
  watch: {
    offsetY (v) {
      if (this.isPaginating !== null && this.isPaginating === false && !this.menuVisible) {
        if (v === 0) {
          this.restore()
        } else if (v > 0) {
          this.move(v)
        }
      }
    }
  },
  methods: {
    // 还原位置
    restore () {
      this.$refs.ebookView.style.top = 0
      this.$refs.ebookView.style.transition = 'all .2s linear'
      setTimeout(() => {
        this.$refs.ebookView.style.transition = ''
      }, 200)
    },
    // 移动位置
    move (offsetY) {
      this.$refs.ebookView.style.top = offsetY + 'px'
    },
    // 开始计算阅读时间
    startLoopReadTime () {
      let readTime = getReadTime(name) // 获取对应电子书缓存的阅读时间
      if (!readTime) {
        readTime = 0
      }
      this.task = setInterval(() => {
        readTime++
        if (readTime % 30 === 0) {
          saveReadTime(this.fileName, readTime)
        }
      }, 1000)
    }
  },
  mounted () {
    this.startLoopReadTime()
  },
  beforeDestroy () {
    if (this.task) {
      clearInterval(this.task)
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global.scss";

  .ebook {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
</style>
