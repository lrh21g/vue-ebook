<template>
  <div class="book-speaking">
    <detail-title @back="back" ref="title"></detail-title>
    <scroll class="content-wrapper"
      :top="42"
      :bottom="scrollBottom"
      :ifNoScroll="disableScroll"
      @onScroll="onScroll"
      ref="scroll">
      <!-- 书籍详情 -->
      <book-info :cover="cover"
        :title="title"
        :author="author"
        :desc="desc"></book-info>
      <!-- 语音朗读头部 -->
      <div class="book-speak-title-wrapper">
        <div class="icon-speak-wrapper">
          <span class="icon-speak"></span>
        </div>
        <div class="speak-title-wrapper">
          <span class="speak-title">{{$t('speak.voice')}}</span>
        </div>
        <div class="icon-down-wrapper" @click="toggleContent">
          <span :class="{'icon-down2': !ifShowContent, 'icon-up': ifShowContent}"></span>
        </div>
      </div>
      <!-- 书籍目录 -->
      <div class="book-detail-content-wrapper" v-show="ifShowContent">
        <div class="book-detail-content-list-wrapper">
          <div class="loading-text-wrapper" v-if="!this.navigation">
            <span class="loading-text">{{$t('detail.loading')}}</span>
          </div>
          <div class="book-detail-content-item-wrapper">
            <div class="book-detail-content-item" v-for="(item, index) in flatNavigation" :key="index"
              @click="speak(item, index)">
              <!-- 播放动画 -->
              <speak-playing v-if="playingIndex === index" :number="5" ref="speakPlaying"></speak-playing>
              <div class="book-detail-content-navigation-text"
                :class="{'is-playing': playingIndex === index}"
                v-if="item.label">{{item.label}}
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio @canplay="onCanPlay" @timeupdate="onTimeUpdate" @ended="onAudioEnded" ref="audio"></audio>
    </scroll>
    <bottom :chapter="chapter"
      :currentSectionIndex="currentSectionIndex"
      :currentSectionTotal="currentSectionTotal"
      :showPlay="showPlay"
      :isPlaying.sync="isPlaying"
      :playInfo="playInfo"
      @onPlayingCardClick="onPlayingCardClick"></bottom>
    <!-- 加载电子书相关信息挂件，实际在页面上不可见 -->
    <div class="book-wrapper">
      <div id="read"></div>
    </div>
    <speak-window :title="this.chapter ? this.chapter.label : ''"
      :book="book"
      :section="section"
      :currentSectionIndex.sync="currentSectionIndex"
      :currentSectionTotal="currentSectionTotal"
      :isPlaying.sync="isPlaying"
      :playInfo="playInfo"
      @updateText="updateText"
      ref="speakWindow"></speak-window>
    <toast :text="toastText" ref="toast"></toast>
  </div>
</template>

<script type="text/ecmascript-6">
import DetailTitle from '@/components/detail/detaiTitle'
import BookInfo from '@/components/detail/bookInfo'
import Scroll from '@/components/Scroll'
import SpeakPlaying from '@/components/speak/speakPlaying'
import Bottom from '@/components/speak/speakBottom'
import SpeakWindow from '@/components/speak/speakMask'
import Toast from '@/components/shelf/toast'
import { findBook, getCategoryName } from '@/utils/book'
import { download, flatList } from '@/api/book'
import { getLocalForage } from '@/utils/localForage'
import { realPx } from '@/utils/utils'
import Epub from 'epubjs'

global.ePub = Epub

export default {
  components: {
    DetailTitle,
    BookInfo,
    Scroll,
    SpeakPlaying,
    Bottom,
    SpeakWindow,
    Toast
  },
  data () {
    return {
      bookItem: null,
      book: null,
      rendition: null,
      metadata: null,
      cover: null,
      navigation: null,
      description: null,
      ifShowContent: true,
      playingIndex: -1,
      paragraph: null,
      currentSectionIndex: null,
      currentSectionTotal: null,
      section: null,
      isPlaying: false, // 是否处于播放状态
      audio: null,
      audioCanPlay: false,
      currentPlayingTime: 0,
      totalPlayingTime: 0,
      playStatus: 0, // 播放状态：0 - 未播放，1 - 播放中，2 - 暂停中
      toastText: '',
      isOnline: false
    }
  },
  computed: {
    // 当前分钟数
    currentMinute () {
      const m = Math.floor(this.currentPlayingTime / 60)
      return m < 10 ? '0' + m : m
    },
    // 当前秒数
    currentSecond () {
      const s = Math.floor(this.currentPlayingTime - parseInt(this.currentMinute) * 60)
      return s < 10 ? '0' + s : s
    },
    // 总共分钟数
    totalMinute () {
      const m = Math.floor(this.totalPlayingTime / 60)
      return m < 10 ? '0' + m : m
    },
    // 总共秒数
    totalSecond () {
      const s = Math.floor(this.totalPlayingTime - parseInt(this.totalMinute) * 60)
      return s < 10 ? '0' + s : s
    },
    // 剩余分钟数
    leftMinute () {
      const m = Math.floor((this.totalPlayingTime - this.currentPlayingTime) / 60)
      return m < 10 ? '0' + m : m
    },
    // 剩余秒数
    leftSecond () {
      const s = Math.floor((this.totalPlayingTime - this.currentPlayingTime) - parseInt(this.leftMinute) * 60)
      return s < 10 ? '0' + s : s
    },
    // 播放音频相关信息
    playInfo () {
      if (this.audioCanPlay) {
        return {
          currentMinute: this.currentMinute, // 当前播放的分钟
          currentSecond: this.currentSecond, // 当前播放的秒数
          totalMinute: this.totalMinute, // 总分钟数
          totalSecond: this.totalSecond, // 总秒数
          leftMinute: this.leftMinute, // 剩余分钟数
          leftSecond: this.leftSecond // 剩余秒数
        }
      } else {
        return null
      }
    },
    lang () {
      return this.metadata ? this.metadata.language : ''
    },
    disableScroll () {
      if (this.$refs.speakWindow) {
        return this.$refs.speakWindow.visible
      } else {
        return false
      }
    },
    showPlay () {
      return this.playingIndex >= 0
    },
    scrollBottom () {
      return this.showPlay ? 116 : 52
    },
    chapter () {
      return this.flatNavigation[this.playingIndex]
    },
    desc () {
      if (this.description) {
        return this.description.substring(0, 100)
      } else {
        return ''
      }
    },
    flatNavigation () {
      if (this.navigation) {
        return Array.prototype.concat.apply([], Array.prototype.concat.apply([], this.doFlatNavigation(this.navigation.toc)))
      } else {
        return []
      }
    },
    category () {
      return this.bookItem ? getCategoryName(this.bookItem.category) : ''
    },
    title () {
      return this.metadata ? this.metadata.title : ''
    },
    author () {
      return this.metadata ? this.metadata.creator : ''
    }
  },
  methods: {
    // audio回调事件：ended - 事件在音频/视频(audio/video)播放完成后触发
    onAudioEnded () {
      this.resetPlay()
      this.currentPlayingTime = this.$refs.audio.currentTime
      const percent = Math.floor((this.currentPlayingTime / this.totalPlayingTime) * 100)
      this.$refs.speakWindow.refreshProgress(percent)
    },
    // audio回调事件：timeupdate - 事件在音频/视频（audio/video）的播放位置发生改变时触发
    onTimeUpdate () {
      this.currentPlayingTime = this.$refs.audio.currentTime
      const percent = Math.floor((this.currentPlayingTime / this.totalPlayingTime) * 100)
      this.$refs.speakWindow.refreshProgress(percent)
    },
    // audio回调事件：canplay - 当浏览器能够开始播放指定的音频/视频时，发生 canplay 事件
    onCanPlay () {
      this.audioCanPlay = true
      this.currentPlayingTime = this.$refs.audio.currentTime
      this.totalPlayingTime = this.$refs.audio.duration
    },
    findBookFromList (fileName) {
      flatList().then(response => {
        if (response.status === 200) {
          const bookList = response.data.data.filter(item => item.fileName === fileName)
          if (bookList && bookList.length > 0) {
            this.bookItem = bookList[0]
            this.init()
          }
        }
      })
    },
    init () {
      const fileName = this.$route.query.fileName
      if (!this.bookItem) {
        this.bookItem = findBook(fileName)
      }
      if (this.bookItem) {
        getLocalForage(fileName, (err, blob) => {
          if (err || !blob) {
            // this.downloadBook(fileName)
            this.isOnline = true
            const opf = this.$route.query.opf
            if (opf) {
              this.parseBook(opf)
            }
          } else {
            this.isOnline = false
            this.parseBook(blob)
          }
        })
      } else {
        this.findBookFromList(fileName)
      }
    },
    downloadBook (fileName) {
      download(
        this.bookItem,
        () => {
          getLocalForage(fileName, (err, blob) => {
            if (err) {
              return
            }
            this.parseBook(blob)
          })
        })
    },
    parseBook (blob) {
      this.book = new Epub(blob)
      this.book.loaded.metadata.then(metadata => {
        this.metadata = metadata
      })
      if (this.isOnline) {
        this.book.coverUrl().then(url => {
          this.cover = url
        })
      } else {
        this.book.loaded.cover.then(cover => {
          this.book.archive.createUrl(cover).then(url => {
            this.cover = url
          })
        })
      }
      this.book.loaded.navigation.then(nav => {
        this.navigation = nav
      })
      this.display()
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
    },
    toggleContent () {
      this.ifShowContent = !this.ifShowContent
    },
    display () {
      const height = window.innerHeight * 0.9 - realPx(40) - realPx(54) - realPx(46) - realPx(48) - realPx(60) - realPx(44)
      this.rendition = this.book.renderTo('read', {
        width: window.innerWidth,
        height: height,
        method: 'default'
      })
      this.rendition.display()
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
    // 朗读对应章节
    speak (item, index) {
      this.resetPlay()
      this.playingIndex = index
      this.$nextTick(() => {
        this.$refs.scroll.refresh()
      })
      if (this.chapter) {
        this.section = this.book.spine.get(this.chapter.href) // 获取书籍对应章节
        // 获取对应章节文本
        this.rendition.display(this.section.href).then(section => {
          const currentPage = this.rendition.currentLocation()
          const cfibase = section.cfiBase
          const cfistart = currentPage.start.cfi.replace(/.*!/, '').replace(/\)/, '')
          const cfiend = currentPage.end.cfi.replace(/.*!/, '').replace(/\)/, '')
          this.currentSectionIndex = currentPage.start.displayed.page
          this.currentSectionTotal = currentPage.start.displayed.total
          const cfi = `epubcfi(${cfibase}!,${cfistart},${cfiend})`
          // console.log(currentPage, cfi, cfibase, cfistart, cfiend)
          this.book.getRange(cfi).then(range => {
            let text = range.toLocaleString()
            text = text.replace(/\s(2,)/g, '')
            text = text.replace(/\r/g, '')
            text = text.replace(/\n/g, '')
            text = text.replace(/\t/g, '')
            text = text.replace(/\f/g, '')
            this.updateText(text)
          })
        })
      }
    },
    showToast (text) {
      this.toastText = text
      this.$refs.toast.show()
    },
    // 播放/暂停 播放音频
    togglePlay () {
      if (!this.isPlaying) {
        if (this.playStatus === 0) {
          this.play() // 播放状态为未播放(0)，则播放音频
        } else if (this.playStatus === 2) {
          this.continuePlay() // 播放状态为暂停中(2)，则播放音频
        }
      } else {
        this.pausePlay() // 播放状态为播放中(1)，则停止播放音频
      }
    },
    // 重置播放状态
    resetPlay () {
      if (this.playStatus === 1) {
        this.pausePlay()
      }
      this.isPlaying = false
      this.playStatus = 0 // 修改播放状态为未播放
    },
    // 播放音频
    play () {
      this.createVoice(this.paragraph)
    },
    // 继续播放
    continuePlay () {
      this.$refs.audio.play().then(() => {
        this.$refs.speakPlaying[0].startAnimation()
        this.isPlaying = true
        this.playStatus = 1
      })
    },
    // 暂停播放音频
    pausePlay () {
      this.$refs.audio.pause()
      this.$refs.speakPlaying[0].stopAnimation() // 停止播放动画
      this.isPlaying = false // 修改播放状态
      this.playStatus = 2 // 修改播放状态为 暂停中
    },
    onPlayingCardClick () {
      this.$refs.speakWindow.show()
    },
    updateText (text) {
      this.paragraph = text
    },
    // 创建播放音频
    createVoice (text) {
      // 使用原生ajax方法，提示兼容性，适应苹果手机
      const xmlhttp = new XMLHttpRequest()
      xmlhttp.open('GET', `${process.env.VUE_APP_VOICE_URL}/voice?text=${text}&lang=${this.lang.toLowerCase()}`, false)
      xmlhttp.send()
      const xmlDoc = xmlhttp.responseText
      if (xmlDoc) {
        const json = JSON.parse(xmlDoc)
        if (json.path) {
          this.$refs.audio.src = json.path
          this.continuePlay()
        } else {
          this.showToast('播放失败，未生成链接')
        }
      } else {
        this.showToast('播放失败')
      }
      /* axios.create({
          baseURL: process.env.VUE_APP_VOICE_URL + '/voice'
        })({
          method: 'get',
          params: {
            text: text,
            lang: this.lang.toLowerCase()
          }
        }).then(response => {
          if (response.status === 200) {
            if (response.data.error === 0) {
              const downloadUrl = response.data.path
              console.log('开始下载...%s', downloadUrl)
              downloadMp3(downloadUrl, blob => {
                const url = window.URL.createObjectURL(blob)
                console.log(blob, url)
                this.$refs.audio.src = url
                this.continuePlay()
              })
            } else {
              this.showToast(response.data.msg)
            }
          } else {
            this.showToast('请求失败')
          }
        }).catch(err => {
          console.log(err)
          this.showToast('播放失败')
        }) */
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-speaking {
    font-size: px2rem(16);
    width: 100%;
    background: white;
    .content-wrapper {
      width: 100%;
      .book-speak-title-wrapper {
        display: flex;
        padding: px2rem(15);
        box-sizing: border-box;
        border-bottom: px2rem(1) solid #eee;
        .icon-speak-wrapper {
          flex: 0 0 px2rem(40);
          @include left;
          .icon-speak {
            font-size: px2rem(24);
            color: #999;
          }
        }
        .speak-title-wrapper {
          flex: 1;
          @include left;
          .speak-title {
            font-size: px2rem(16);
            font-weight: bold;
            color: #666;
          }
        }
        .icon-down-wrapper {
          flex: 0 0 px2rem(40);
          @include right;
          .icon-up {
            font-size: px2rem(12);
            color: #999;
          }
          .icon-down2 {
            font-size: px2rem(12);
            color: #999;
          }
        }
      }
      .book-detail-content-wrapper {
        width: 100%;
        border-bottom: px2rem(1) solid #eee;
        box-sizing: border-box;
        .book-detail-content-list-wrapper {
          padding: px2rem(10) px2rem(15);
          .loading-text-wrapper {
            width: 100%;
            .loading-text {
              font-size: px2rem(14);
              color: #999;
            }
          }
          .book-detail-content-item-wrapper {
            .book-detail-content-item {
              display: flex;
              padding: px2rem(15) 0;
              font-size: px2rem(14);
              line-height: px2rem(16);
              color: #333;
              border-bottom: px2rem(1) solid #eee;
              &:last-child {
                border-bottom: none;
              }
              .book-detail-content-navigation-text {
                flex: 1;
                width: 100%;
                @include ellipsis;
                &.is-playing {
                  color: $color-blue;
                  font-weight: bold;
                  margin-left: px2rem(10);
                }
              }
            }
          }
        }
      }
    }
    .book-wrapper {
      position: absolute;
      bottom: -100%;
      z-index: 100;
    }
  }
</style>
