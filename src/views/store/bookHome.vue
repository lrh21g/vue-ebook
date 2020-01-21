<template>
  <div class="book-home">
    <search-bar
      @showFlapCard="showFlapCard"
      :ifShowSearchPage.sync="ifShowSearchPage"
      :ifShowHotSearch.sync="ifShowHotSearch"
      :bookListOffsetY="bookListOffsetY"
      @back="onBack"
      ref="searchBar"></search-bar>
    <div class="book-list-wrapper" v-show="!ifShowSearchPage || !ifShowHotSearch" ref="bookListWrapper">
      <div class="banner-wrapper">
        <div class="banner" :style="bannerStyle"></div>
      </div>
      <guess-you-like :data="guessYouLike" ref="guessYouLike"></guess-you-like>
      <recommend class="recommend" :data="recommend" ref="recommend"></recommend>
      <featured class="featured"
        :data="featured"
        :titleText="$t('home.featured')"
        :btnText="$t('home.seeAll')"
        ref="featured"></featured>
      <div class="category-list-wrapper" v-for="(item, index) in categoryList" :key="index">
        <category-book :data="item"></category-book>
      </div>
      <category class="category" :data="categories"></category>
    </div>
    <flap-card v-if="ifFlapCardShow" @close="closeFlapCard" :data="random" ref="flapCard"></flap-card>
  </div>
</template>

<script>
import FlapCard from '@/components/home/flapCard'
import SearchBar from '@/components/home/searchBar'
import GuessYouLike from '@/components/home/guessYouLike'
import Recommend from '@/components/home/recommend'
import Featured from '@/components/home/featured'
import CategoryBook from '@/components/home/categoryBook'
import Category from '@/components/home/category'
import { home } from '@/api/book'
import { realPx } from '@/utils/utils'
import { getLocalStorage, setLocalStorage, getHome, saveHome } from '@/utils/localStorage'

export default {
  name: 'bookHome',
  components: {
    FlapCard,
    SearchBar,
    GuessYouLike,
    Recommend,
    Featured,
    CategoryBook,
    Category
  },
  data () {
    return {
      data: null,
      guessYouLike: null, // 猜你喜欢 - 书籍列表
      recommend: null, // 推荐 - 书籍列表
      featured: null, // 精选 - 书籍列表
      categoryList: null, // 分类书籍列表
      categories: null, // 分类列表
      random: null, // 随机推荐书籍信息
      randomList: null, // 随机推荐书籍列表
      bannerStyle: null,
      isBack: false,
      ifFlapCardShow: false, // 是否显示推荐书籍
      ifShowSearchPage: false, // 是否显示搜索
      ifShowHotSearch: false, // 是否显示热门搜索
      bookListOffsetY: 0
    }
  },
  mounted () {
    const homeFromLocalStorage = getHome()
    if (homeFromLocalStorage) {
      console.log('书城主页，使用缓存')
      this.parseHomeData(homeFromLocalStorage)
    } else {
      console.log('书城主页，请求数据')
      home().then(response => {
        if (response.status === 200 && response.data) {
          this.parseHomeData(response.data)
          saveHome(response.data)
        }
      })
    }
    this.$refs.bookListWrapper.style.height = window.innerHeight - realPx(52) + 'px'
    this.$refs.bookListWrapper.addEventListener('scroll', this.handleBookListScroll)
    this.bookListOffsetY = getLocalStorage('offsetY')
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      if (from.path === '/book-store/list' && from.query.keyword) {
        vm.ifShowSearchPage = true
        vm.$refs.searchBar.setKeyword(from.query.keyword)
      }
    })
  },
  beforeDestroy () {
    if (this.bookListOffsetY && !this.isBack) {
      setLocalStorage('offsetY', this.bookListOffsetY)
    } else {
      setLocalStorage('offsetY', 0)
    }
  },
  methods: {
    onBack () {
      this.isBack = true
    },
    handleBookListScroll (e) {
      const target = e.target
      if (target) {
        this.bookListOffsetY = target.scrollTop
        if (target.scrollTop > 0) {
          if (this.$refs.searchBar) {
            this.$refs.searchBar.showSearchPage()
            this.$refs.searchBar.showShadow()
            this.ifShowHotSearch = false
          }
        } else {
          if (this.$refs.searchBar) {
            this.$refs.searchBar.hideSearchPage()
          }
        }
      }
    },
    // 显示随机推荐书籍
    showFlapCard () {
      this.ifFlapCardShow = true
      const randomNumber = parseInt(Math.random() * this.randomList.length)
      this.random = this.randomList[randomNumber]
      this.$nextTick(() => {
        this.$refs.flapCard.startAnimation()
      })
    },
    // 关闭随机推荐书籍
    closeFlapCard () {
      this.$refs.flapCard.stopAnimation()
      this.ifFlapCardShow = false
    },
    parseHomeData (data) {
      console.log('bookHome parseHomeData data', data)
      this.data = data
      this.guessYouLike = data.guessYouLike
      this.recommend = data.recommend
      this.featured = data.featured
      this.categoryList = data.categoryList
      this.categories = data.categories
      this.randomList = data.random
      this.bannerStyle = {
        backgroundImage: 'url(' + data.banner + ')'
      }
      this.$nextTick(() => {
        if (this.bookListOffsetY) {
          this.$refs.bookListWrapper.scrollTo(0, this.bookListOffsetY)
        }
      })
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .book-home {
    position: relative;
    width: 100%;
    height: 100%;
    background: #fff;
    font-size: px2rem(16);
    color: #666;
    .book-list-wrapper {
      width: 100%;
      overflow-x: hidden;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      &::-webkit-scrollbar {
        display: none;
      }
      .banner-wrapper {
        width: 100%;
        padding: px2rem(10);
        box-sizing: border-box;
        .banner {
          width: 100%;
          height: px2rem(150);
          background-repeat: no-repeat;
          background-size: 100% 100%;
        }
      }
      .recommend {
        margin-top: px2rem(20);
      }
      .featured {
        margin-top: px2rem(20);
      }
      .category-list-wrapper {
        margin-top: px2rem(20);
      }
      .category {
        margin-top: px2rem(20);
      }
    }
  }
</style>
