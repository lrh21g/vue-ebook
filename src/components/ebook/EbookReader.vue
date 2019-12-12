<template>
  <div class="ebook-reader">
    <div id="read"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Epub from 'epubjs'

global.epub = Epub

export default {
  computed: {
    ...mapGetters(['fileName'])
  },
  mounted () {
    this.$store.dispatch('setFileName', this.$route.params.fileName.split('|').join('/'))
      .then(() => {
        this.initEpub()
      })
  },
  methods: {
    initEpub () {
      const url = 'http:xxx.xxx.xx.xxx:8081/epub/' + this.fileName + '.epub'
      this.book = new Epub(url)
      this.rendition = this.book.renderTo({
        width: innerWidth,
        height: innerHeight,
        method: 'default'
      })
      this.rendition.display()
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global.scss";
</style>
