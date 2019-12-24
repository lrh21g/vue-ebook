import { realPx } from '../../utils/utils'

const book = {
  state: {
    fileName: '', // epub文件名
    menuVisible: false, // 是否显示阅读器菜单
    settingVisible: -1, // 阅读器设置：-1:不显示，0:字号，1:主题，2:进度，3:目录
    defaultFontSize: 16, // 默认字体大小
    defaultFontFamily: 'Default', // 默认字体样式
    fontFamilyVisible: false, // 字体设置是否显示
    defaultTheme: 'Default', // 默认主题
    bookAvailable: false, // 电子书进度条是否禁用  false:禁用
    progress: 0, // 阅读进度
    section: 0, // 章节
    isPaginating: true,
    currentBook: null, // new Epub() 全局对象
    navigation: null,
    cover: null,
    metadata: null,
    paginate: '',
    pagelist: null,
    offsetY: 0,
    isBookmark: null,
    speakingIconBottom: realPx(58)
  },
  mutations: {
    'SET_FILENAME': (state, fileName) => {
      state.fileName = fileName
    },
    'SET_MENU_VISIBLE': (state, visible) => {
      state.menuVisible = visible
    },
    'SET_SETTING_VISIBLE': (state, visible) => {
      state.settingVisible = visible
    },
    'SET_DEFAULT_FONT_SIZE': (state, fontSize) => {
      state.defaultFontSize = fontSize
    },
    'SET_DEFAULT_FONT_FAMILY': (state, font) => {
      state.defaultFontFamily = font
    },
    'SET_FONT_FAMILY_VISIBLE': (state, visible) => {
      state.fontFamilyVisible = visible
    },
    'SET_DEFAULT_THEME': (state, theme) => {
      state.defaultTheme = theme
    },
    'SET_BOOK_AVAILABLE': (state, bookAvailable) => {
      state.bookAvailable = bookAvailable
    },
    'SET_PROGRESS': (state, progress) => {
      state.progress = progress
    },
    'SET_SECTION': (state, section) => {
      state.section = section
    },
    'SET_IS_PAGINATING': (state, isPaginating) => {
      state.isPaginating = isPaginating
    },
    'SET_CURRENT_BOOK': (state, currentBook) => {
      state.currentBook = currentBook
    },
    'SET_NAVIGATION': (state, navigation) => {
      state.navigation = navigation
    },
    'SET_COVER': (state, cover) => {
      state.cover = cover
    },
    'SET_METADATA': (state, metadata) => {
      state.metadata = metadata
    },
    'SET_PAGINATE': (state, paginate) => {
      state.paginate = paginate
    },
    'SET_PAGELIST': (state, pagelist) => {
      state.pagelist = pagelist
    },
    'SET_OFFSETY': (state, offsetY) => {
      state.offsetY = offsetY
    },
    'SET_IS_BOOKMARK': (state, isBookmark) => {
      state.isBookmark = isBookmark
    },
    'SET_SPEAKING_ICON_BOTTOM': (state, speakingIconBottom) => {
      state.speakingIconBottom = speakingIconBottom
    }
  }
}

export default book
