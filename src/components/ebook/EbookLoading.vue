<template>
  <div class="ebook-loading">
    <div class="ebook-loading-wrapper">
      <div class="ebook-loading-item" v-for="(item, index) in data" :key="index">
        <div class="ebook-loading-line-wrapper" v-for="(subItem, subIndex) in item" :key="subIndex">
          <div class="ebook-loading-line" ref="line"></div>
          <div class="ebook-loading-mask" ref="mask"></div>
        </div>
      </div>
      <div class="ebook-loading-center"></div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
// ┌─────┬─────┐
// │ ─── │ ─── │
// │ ─── │ ─── │
// │ ─── │ ─── │
// └─────┴─────┘
// 目录加载loading动画：loading动画并不是通过改变线条的总体宽度进行的，而是将一条线分为【不透明部分】和【透明部分】，通过修改不透明部分的宽度进行的。
// 原因：如果控制线条的总体宽度，很难控制显示的方向，比如，增加向右，减少向左
// 原理：一条线由【不透明】部分（class类为：ebook-loading-line）和【透明】（class类为：ebook-loading-mask）组成
//      设置一条线的总体部分为flex布局，通过改变flex布局的宽度，从而产生一条线移动的动画
// 示例：【—————不透明部分————------透明部分------】

import { px2rem } from '@/utils/utils'

export default {
  data () {
    return {
      data: [
        [{}, {}, {}],
        [{}, {}, {}]
      ], // 用于使用v-for生成loading效果中，左右两侧的各三条线
      maskWidth: [
        { value: 0 },
        { value: 0 },
        { value: 0 },
        { value: 0 },
        { value: 0 },
        { value: 0 }
      ], // 定义【透明】部分的线的默认宽度为 0
      lineWidth: [
        { value: 16 },
        { value: 16 },
        { value: 16 },
        { value: 16 },
        { value: 16 },
        { value: 16 }
      ], // 定义【不透明】部分的线的默认宽度为 16
      add: true, // 表示宽度是否需要增加了
      end: false // 表示最后一条线的【透明】部分或者【不透明】部分的宽度是否已经达到最大值
    }
  },
  methods: {},
  mounted () {
    this.task = setInterval(() => {
      this.$refs.mask.forEach((item, index) => {
        const mask = this.$refs.mask[index] // 获取【透明】部分的线的 DOM
        const line = this.$refs.line[index] // 获取【不透明】部分的线的 DOM
        let maskWidth = this.maskWidth[index] // 获取【透明】部分的线的 宽度
        let lineWidth = this.lineWidth[index] // 获取【不透明】部分的线的 宽度
        if (index === 0) {
          // 当为第一条线的时候
          if (this.add && maskWidth.value < 16) {
            // 第一条线：宽度需要增加，并且【透明】部分的宽度小于16的时候
            maskWidth.value++ // 【透明】部分宽度增加
            lineWidth.value-- // 【不透明】部分宽度减小
          } else if (!this.add && lineWidth.value < 16) {
            // 第一条线：宽度不需要增加，并且【不透明】部分的宽度小于16的时候
            maskWidth.value--
            lineWidth.value++
          }
        } else {
          // 不为第一条线的时候
          if (this.add && maskWidth.value < 16) {
            // 不为第一条线：宽度需要增加，并且【透明】部分的宽度小于16的时候
            let preMaskWidth = this.maskWidth[index - 1] // 获取上一条线的【透明】部分的宽度
            if (preMaskWidth.value >= 8) {
              // 当上一条线的【透明】部分的线宽度 >= 8 的时候，即【不透明】部分显示为总线的一半的时候
              maskWidth.value++
              lineWidth.value--
            }
          } else if (!this.add && lineWidth.value < 16) {
            // 不为第一条线：宽度不需要增加，并且【透明】部分的宽度小于16的时候
            let preLineWidth = this.lineWidth[index - 1]
            if (preLineWidth.value >= 8) {
              maskWidth.value--
              lineWidth.value++
            }
          }
        }
        // 修改样式：【透明】部分的宽度以及flex布局的宽度，【不透明】部分的宽度以及flex布局的宽度
        mask.style.width = `${px2rem(maskWidth.value)}rem`
        mask.style.flex = `0 0 ${px2rem(maskWidth.value)}rem`
        line.style.width = `${px2rem(lineWidth.value)}rem`
        line.style.flex = `0 0 ${px2rem(lineWidth.value)}rem`
        if (index === this.maskWidth.length - 1) {
          // 如果当前线条为最后一条线
          if (this.add) {
            // 宽度需要增加
            if (maskWidth.value === 16) {
              // 【透明】部分的宽度为 16，则表示宽度达到最大值
              this.end = true
            }
          } else {
            // 宽度不需要增加
            if (maskWidth.value === 0) {
              // 【透明】部分的宽度为 0，即【不透明】部分，达到最大值，则表示宽度达到最大值
              this.end = true
            }
          }
        }
        if (this.end) {
          // 宽度达到最大值，则是否需要增加取反，取消最大宽度限制
          this.add = !this.add
          this.end = false
        }
      })
    }, 20)
  },
  beforeDestroy () {
    if (this.task) {
      clearInterval(this.task)
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .ebook-loading {
    position: relative;
    z-index: 500;
    width: px2rem(63);
    height: px2rem(40);
    background: transparent;
    border: px2rem(1.5) solid #d7d7d7;
    border-radius: px2rem(3);
    .ebook-loading-wrapper {
      display: flex;
      width: 100%;
      height: 100%;
      .ebook-loading-item {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: px2rem(7) 0;
        box-sizing: border-box;
        .ebook-loading-line-wrapper {
          flex: 1;
          padding: 0 px2rem(7);
          box-sizing: border-box;
          @include left;
          .ebook-loading-mask {
            flex: 0 0 0;
            width: 0;
            height: px2rem(1.5);
          }
          .ebook-loading-line {
            flex: 0 0 px2rem(16);
            width: px2rem(16);
            height: px2rem(2);
            background: #d7d7d7;
          }
        }
      }
      .ebook-loading-center {
        position: absolute;
        left: 50%;
        top: 0;
        width: px2rem(1.5);
        height: 100%;
        background: #d7d7d7;
      }
    }
  }
</style>
