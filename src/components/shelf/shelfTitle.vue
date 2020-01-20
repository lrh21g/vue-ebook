<template>
  <div class="shelf-title-wrapper" :class="{'hide-shadow': ifHideShadow}">
    <!-- 标题 -->
    <div class="title">
      <span class="title-text">{{title}}</span>
      <span class="sub-title-text" v-show="isEditMode">{{selectedText}}</span>
    </div>
    <!-- 书架页面 - 左边 - 当需要显示清除缓存 并且 书架数据不为空，显示【清楚缓存】 -->
    <div class="btn-clear-wrapper" @click="clearCache" v-if="ifShowClear && !isDataEmpty">
      <span class="btn-clear">{{$t('shelf.clearCache')}}</span>
    </div>
    <!-- 书架页面 - 右边 - 当书架数据不为空的时候，书架数据不为空，显示【编辑 / 取消】 -->
    <div class="btn-text-wrapper" @click="onEditClick" v-if="!ifGroupEmpty && !isDataEmpty">
      <span class="btn-text">{{isEditMode ? $t('shelf.cancel') : $t('shelf.edit')}}</span>
    </div>
    <!-- 书架页面 - 右边 - 当书架数据为空的时候，显示【切换语言】-->
    <div class="btn-text-wrapper" @click="changeLanguage" v-if="isDataEmpty">
      <span class="btn-text">{{$t('shelf.changeLanguage')}}</span>
    </div>
    <!-- 书籍分组页面 - 左边 - 当显示需要显示返回 并且 不处于编辑状态，显示【返回】 -->
    <div class="btn-back-wrapper" @click="back" v-if="ifShowBack && !isEditMode">
      <span class="icon-back"></span>
    </div>
    <!-- 书籍分组页面 - 左边 - 当显示需要显示返回 并且 处于编辑状态，显示【修改分组】 -->
    <div class="btn-back-wrapper" @click="changeGroup" v-if="ifShowBack && isEditMode">
      <span class="btn-text">{{$t('shelf.editGroup')}}</span>
    </div>
    <!-- 书籍分组页面 - 右边 - 当书籍分组内数据为空的时候，书架数据不为空，显示【修改分组】  -->
    <div class="btn-text-wrapper" @click="changeGroup" v-if="ifGroupEmpty && !isDataEmpty">
      <span class="btn-text">{{$t('shelf.editGroup')}}</span>
    </div>
    <popup ref="popup"
      :title="popupTitle"
      :thirdText="thirdText"
      :confirmText="confirmText"
      :isRemoveText="true"
      :cancelText="$t('shelf.cancel')"
      @confirm="onPopupDelete"
      @third="onPopupChange"></popup>
    <shelf-group-dialog :visible.sync="ifGroupDialogShow"
      :isEditGroupName="true"
      :category="category"
      @editGroupName="editGroupName"
      ref="groupDialog"></shelf-group-dialog>
  </div>
</template>

<script>
import Popup from '@/components/shelf/popup'
import ShelfGroupDialog from '@/components/shelf/shelfGroupDialog'
import { switchLocale } from '@/utils/book'

export default {
  name: 'shelfTitle',
  components: {
    ShelfGroupDialog,
    Popup
  },
  props: {
    isEditMode: Boolean, // 是否编辑分组
    ifShowBack: Boolean, // 是否显示返回
    ifShowClear: Boolean, // 是否显示清除缓存
    ifGroupEmpty: Boolean, // 书籍分组是否为空
    data: Array,
    title: String, // 标题
    category: Object
  },
  data () {
    return {
      ifHideShadow: true, // 是否隐藏阴影
      ifGroupDialogShow: false, // 是否显示分组弹窗
      isDeleteGroup: false
    }
  },
  computed: {
    isDataEmpty () {
      return !this.data || this.data.filter(item => item.type !== 3).length === 0
    },
    selectedText () {
      return this.selectedNumber === 0 ? this.$t('shelf.selectBook') : (this.selectedNumber === 1 ? this.$t('shelf.haveSelectedBook').replace('$1', this.selectedNumber) : this.$t('shelf.haveSelectedBooks').replace('$1', this.selectedNumber))
    },
    selectedNumber () {
      if (this.category && this.category.itemList) {
        return this.category.itemList.filter(item => item.selected).length
      } else if (this.data) {
        return this.data.filter(item => item.selected).length
      } else {
        return 0
      }
    },
    thirdText () {
      if (this.isDeleteGroup) {
        return ''
      } else {
        return this.$t('shelf.editGroupName')
      }
    },
    popupTitle () {
      if (this.isDeleteGroup) {
        return this.$t('shelf.deleteGroupTitle')
      } else {
        return ''
      }
    },
    confirmText () {
      if (this.isDeleteGroup) {
        return this.$t('shelf.confirm')
      } else {
        return this.$t('shelf.deleteGroup')
      }
    }
  },
  methods: {
    // 切换语言
    changeLanguage () {
      switchLocale(this)
    },
    // 编辑分组名
    editGroupName (category, groupName) {
      this.$emit('editGroupName', category, groupName)
    },
    // 显示弹窗
    showPopup () {
      this.$refs.popup.show()
    },
    onPopupDelete () {
      if (this.isDeleteGroup) {
        this.$emit('deleteGroup', this.category)
        this.isDeleteGroup = false
      } else {
        this.$refs.popup.hide()
        setTimeout(() => {
          this.isDeleteGroup = true
          this.$refs.popup.show()
        }, 200)
      }
    },
    onPopupChange () {
      this.ifGroupDialogShow = true
      this.$refs.groupDialog.showEditGroupDialog()
    },
    changeGroup () {
      this.showPopup()
    },
    // 返回上一级
    back () {
      this.$router.go(-1)
    },
    // 清除缓存
    clearCache () {
      this.$emit('clearCache')
    },
    // 显示阴影
    showShadow () {
      this.ifHideShadow = false
    },
    // 隐藏阴影
    hideShadow () {
      this.ifHideShadow = true
    },
    // 点击【编辑/取消】
    onEditClick () {
      if (this.isEditMode) {
        this.$emit('onEditClick', false)
      } else {
        this.$emit('onEditClick', true)
      }
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .shelf-title-wrapper {
    position: relative;
    z-index: 130;
    width: 100%;
    height: px2rem(42);
    background: white;
    box-shadow: 0 px2rem(2) px2rem(2) 0 rgba(0, 0, 0, .1);
    &.hide-shadow {
      box-shadow: none;
    }
    .title {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 110;
      width: 100%;
      height: px2rem(42);
      @include columnCenter;
      .title-text {
        font-size: px2rem(16);
        line-height: px2rem(20);
        font-weight: bold;
        color: #333;
      }
      .sub-title-text {
        font-size: px2rem(10);
        color: #333;
      }
    }
    .btn-text-wrapper {
      position: absolute;
      right: 0;
      top: 0;
      z-index: 115;
      padding-right: px2rem(16.5);
      box-sizing: border-box;
      height: 100%;
      @include center;
      .btn-text {
        font-size: px2rem(14);
        color: #666;
      }
    }
    .btn-clear-wrapper {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 115;
      padding-left: px2rem(16.5);
      box-sizing: border-box;
      height: 100%;
      @include center;
      .btn-clear {
        font-size: px2rem(14);
        color: #666;
      }
    }
    .btn-back-wrapper {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 115;
      padding-left: px2rem(16.5);
      box-sizing: border-box;
      height: 100%;
      font-size: px2rem(20);
      color: #666;
      @include center;
      &:active {
        color: rgba(102, 102, 102, .5);
      }
      .btn-text {
        font-size: px2rem(14);
        color: #666;
      }
    }
  }
</style>
