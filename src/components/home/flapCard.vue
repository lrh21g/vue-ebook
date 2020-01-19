<template>
  <div class="flap-card-wrapper">
    <div class="flap-card-bg" :class="{'animation': runFlapCardAnimation}" v-if="ifShowFlapCard">
      <div class="flap-card" v-for="(item, index) in flapCardList" :key="index" :style="{zIndex: item.zIndex}">
        <div class="flap-card-semi-circle">
          <div class="flap-card-semi-circle-left" :style="semiCircleStyle(item, 'left')" ref="left"></div>
          <div class="flap-card-semi-circle-right" :style="semiCircleStyle(item, 'right')" ref="right"></div>
        </div>
      </div>
      <div class="point-wrapper" v-if="ifShowPoint">
        <div class="point" :class="{'animation': runPointAnimation}" v-for="(item, index) in pointList" :key="index"></div>
      </div>
    </div>
    <div class="book-card" :class="{'animation': runBookCardAnimation}" v-if="ifShowBookCard">
      <div class="book-card-wrapper">
        <div class="img-wrapper">
          <img class="img" v-lazy="data.cover">
        </div>
        <div class="content-wrapper">
          <div class="title">{{data.title}}</div>
          <div class="author sub-title-medium">{{data.author}}</div>
          <div class="category">{{categoryText()}}</div>
        </div>
        <div class="read-btn" @click.stop="showBookDetail">{{$t('home.readNow')}}</div>
      </div>
    </div>
    <div class="close-btn-wrapper" @click="close">
      <span class="icon-close"></span>
    </div>
  </div>
</template>

<script>
import { categoryText, showBookDetail } from '@/utils/book'
import { flapCardList } from '@/utils/flapCardList'

export default {
  name: 'flapCard',
  props: {
    data: Object
  },
  data () {
    return {
      pointList: [],
      flapCardList: flapCardList,
      // 卡片动画“
      // 当第一张右边部分图片旋转的时候，第一个图片为正面，第二个图片为反面（即：front:0, back: 1）
      // 当第二张右边部分图片旋转的时候，第二个图片为正面，第三个图片为反面（即：front:1, back: 3）
      // 依次类推...
      front: 0, // 正面
      back: 1, // 背面
      intervalTime: 25, // 卡片动画时间 (setInterval)
      runFlapCardAnimation: false, // 运行卡片动画
      runPointAnimation: false, // 运行卡片烟花动画
      runBookCardAnimation: false, // 运行书籍卡片动画
      ifShowBookCard: false, // 是否显示书籍卡片
      ifShowFlapCard: true, // 是否显示卡片动画
      ifShowPoint: true // 是否显示卡片烟花动画
    }
  },
  created () {
    for (let i = 0; i < 18; i++) {
      this.pointList.push({})
    }
  },
  mounted () {
    // this.startAnimation()
  },
  methods: {
    close () {
      this.$emit('close')
    },
    categoryText () {
      return categoryText(this.data.category, this)
    },
    showBookDetail () {
      if (this.data) {
        showBookDetail(this, this.data)
      }
    },
    // 开始动画
    startAnimation () {
      this.runFlapCardAnimation = true
      setTimeout(() => {
        this.startFlapCardAnimation()
      }, 300)
      setTimeout(() => {
        this.startPointAnimation()
      }, 300)
      setTimeout(() => {
        this.stopAnimation()
        this.showBookCard()
      }, 2500)
    },
    // 停止动画
    stopAnimation () {
      clearInterval(this.task)
      this.runFlapCardAnimation = false
      this.runPointAnimation = false
    },
    // 显示书籍card
    showBookCard () {
      this.ifShowBookCard = true
      this.runBookCardAnimation = true
      this.ifShowFlapCard = false
      this.ifShowPoint = false
    },
    // 开始卡片烟花动画
    startPointAnimation () {
      this.runPointAnimation = true
      setTimeout(() => {
        this.runPointAnimation = false
      }, 750)
    },
    // 开始卡片旋转动画
    startFlapCardAnimation () {
      this.prepare() // 创建卡片旋转动画前的准备
      this.task = setInterval(() => {
        this.rotateSemiCircle()
      }, this.intervalTime)
    },
    // 创建卡片旋转动画前的准备: 设置背面的初始值
    prepare () {
      const backFlapCard = this.flapCardList[this.back] // 获取背面卡片相关信息
      const backLeftSemiCircle = this.$refs.left[this.back] // 获取背面卡片DOM
      backFlapCard.rotateDegree = 180 // 初始化反面卡片旋转角度为 180度
      backFlapCard._g = backFlapCard.g - 5 * 9 // 初始化反面卡片色值减少 5 * 9，以便之后进行增加到原有色值
      this.rotate(backFlapCard, backLeftSemiCircle)
    },
    // 重置当前正反卡片，切换到下一个卡片
    reset () {
      const frontFlapCard = this.flapCardList[this.front] // 获取正面卡片相关信息
      const backFlapCard = this.flapCardList[this.back] // 获取背面卡片相关信息
      const frontRightSemiCircle = this.$refs.right[this.front] // 获取正面卡片DOM
      const backLeftSemiCircle = this.$refs.left[this.back] // 获取背面卡片DOM
      frontFlapCard.rotateDegree = 0 // 重置正面旋转角度为 0
      backFlapCard.rotateDegree = 0 // 重置反面面旋转角度为 0
      frontFlapCard._g = frontFlapCard.g // 重置正面色值为初始值
      backFlapCard._g = backFlapCard.g // 重置正面色值为初始值
      this.rotate(frontFlapCard, frontRightSemiCircle)
      this.rotate(backFlapCard, backLeftSemiCircle)
      // 切换到下一个卡片
      this.front++
      this.back++
      const len = this.flapCardList.length
      // 防止溢出
      if (this.front >= len) {
        this.front = 0
      }
      if (this.back >= len) {
        this.back = 0
      }
      // 动态设置 zIndex
      // 100 -> 96
      // 99 -> 100
      // 98 -> 99
      // 97 -> 98
      // 96 -> 97
      this.flapCardList.forEach((item, index) => {
        // 示例：当前正面 front 为 0， 则 （0 - 1 + 5） % 5 = 4
        item.zIndex = 100 - ((index - this.front + len) % len)
      })
      this.prepare() // 创建卡片旋转动画前的准备: 设置背面的初始值
    },
    // 旋转半圆
    rotateSemiCircle () {
      const frontFlapCard = this.flapCardList[this.front] // 获取正面卡片相关信息
      const backFlapCard = this.flapCardList[this.back] // 获取背面卡片相关信息
      const frontRightSemiCircle = this.$refs.right[this.front] // 获取正面卡片DOM
      const backLeftSemiCircle = this.$refs.left[this.back] // 获取背面卡片DOM
      frontFlapCard.rotateDegree += 10 // 正面卡片从0度开始，旋转角度每次 +10 度 （正面向左旋转）
      backFlapCard.rotateDegree -= 10 // 背面卡片从180度开始，旋转角度每次 -10 度 （负面向左旋转）
      if (frontFlapCard.rotateDegree < 90) {
        // 正面卡片从0度，旋转角度每次 +10 度，小于 90度 的时候，色值每次 -5
        frontFlapCard._g -= 5
      }
      if (backFlapCard.rotateDegree < 90) {
        // 反面卡片从180度，旋转角度每次 -10 度，小于 90度 的时候，色值每次 +5
        backFlapCard._g += 5
      }
      if (frontFlapCard.rotateDegree === 90 && backFlapCard.rotateDegree === 90) {
        // 当正面卡片和反面卡片旋转角度都为 90度 时，将反面卡片的层级 +2（正面卡片和反面卡片的层级差为 1，则需要 +2）
        // 继续旋转时，反面卡片在正面卡片之上
        backFlapCard.zIndex += 2
      }
      this.rotate(frontFlapCard, frontRightSemiCircle)
      this.rotate(backFlapCard, backLeftSemiCircle)
      if (frontFlapCard.rotateDegree === 180 && backFlapCard.rotateDegree === 0) {
        // 正面卡片角度为 180度，反面角度为 0度时，进行切换到下一个卡片
        this.reset()
      }
    },
    rotate (item, dom) {
      dom.style.transform = `rotateY(${item.rotateDegree}deg)`
      dom.style.backgroundColor = `rgb(${item.r} ,${item._g} ,${item.b})`
    },
    // 半圆样式 - direction表示是图片左边部分（'left'）还是图片右部分（'right'）
    semiCircleStyle (item, direction) {
      return {
        backgroundColor: `rgb(${item.r} ,${item.g} ,${item.b})`,
        backgroundImage: direction === 'left' ? item.imgLeft : item.imgRight,
        backgroundSize: item.backgroundSize
      }
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .flap-card-wrapper {
    // position: absolute;
    // top: 0;
    // left: 0;
    // right: 0;
    // bottom: 0;
    z-index: 1000;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    @include absCenter;
    @include center;
    .flap-card-bg {
      position: relative;
      width: px2rem(64);
      height: px2rem(64);
      background: white;
      border-radius: px2rem(5);
      // transform: scale(0);
      // opacity: 0;
      &.animation {
        animation: scale 0.3s ease-in both;
      }
      @keyframes scale {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        70% {
          transform: scale(1.3);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .flap-card {
        // position: absolute;
        // top: 0;
        // left: 0;
        // right: 0;
        // bottom: 0;
        // margin: auto;
        z-index: 1500;
        width: px2rem(48);
        height: px2rem(48);
        @include absCenter;
        .flap-card-semi-circle {
          width: 100%;
          height: 100%;
          display: flex;
          .flap-card-semi-circle-left {
            flex: 0 0 50%;
            width: 50%;
            height: 100%;
            background-color: #ffc666;
            background-repeat: no-repeat;
            background-position: center right;
            border-radius: px2rem(24) 0 0 px2rem(24);
            transform-origin: right;
            backface-visibility: hidden;
          }
          .flap-card-semi-circle-right {
            flex: 0 0 50%;
            width: 50%;
            height: 100%;
            background-repeat: no-repeat;
            background-position: center left;
            border-radius: 0 px2rem(24) px2rem(24) 0;
            transform-origin: left;
            backface-visibility: hidden; // 更改一个元素变形的原点
            // 指定当元素背面朝向观察者时是否可见(项目中图片旋转至背面则隐藏)
            // 元素的背面是其正面的镜像。虽然在 2D 中不可见，但是当变换导致元素在 3D 空间中旋转时，背面可以变得可见。 （此属性对 2D 变换没有影响，它没有透视。）
          }
        }
      }
      .point-wrapper {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 2000;
        @include center;
        .point {
          @include absCenter;
          z-index: 3000;
          border-radius: 50%;
          transform: scale(0);
          &.animation {
            @for $i from 1 to length($moves) + 1 {
              &:nth-child(#{$i}) {
                @include move($i);
              }
            }
          }
        }
      }
    }
    .book-card {
      position: relative;
      width: 65%;
      // height: 70%;
      box-sizing: border-box;
      border-radius: px2rem(15);
      background: white;
      &.animation {
        animation: scale .3s ease-in both;
        @keyframes scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      }
      .book-card-wrapper {
        width: 100%;
        height: 100%;
        margin-bottom: px2rem(30);
        @include columnTop;
        .img-wrapper {
          width: 100%;
          margin-top: px2rem(20);
          @include center;
          .img {
            width: px2rem(90);
            height: px2rem(130);
          }
        }
        .content-wrapper {
          padding: 0 px2rem(20);
          margin-top: px2rem(20);
          .title {
            color: #333;
            font-weight: bold;
            font-size: px2rem(18);
            line-height: px2rem(20);
            max-height: px2rem(40);
            text-align: center;
            @include ellipsis2(2)
          }
          .author {
            margin-top: px2rem(10);
            text-align: center;
          }
          .category {
            color: #999;
            font-size: px2rem(14);
            margin-top: px2rem(10);
            text-align: center;
          }
        }
        .read-btn {
          position: absolute;
          bottom: 0;
          left: 0;
          z-index: 1100;
          width: 100%;
          border-radius: 0 0 px2rem(15) px2rem(15);
          padding: px2rem(15) 0;
          text-align: center;
          color: white;
          font-size: px2rem(14);
          background: $color-blue;
        }
      }
    }
    .close-btn-wrapper {
      position: absolute;
      left: 0;
      bottom: px2rem(30);
      z-index: 1100;
      width: 100%;
      @include center;
      .icon-close {
        display: inline-block;
        width: px2rem(45);
        height: px2rem(45);
        font-size: px2rem(25);
        color: white;
        background: #333;
        border-radius: 50%;
        @include center;
      }
    }
  }
</style>
