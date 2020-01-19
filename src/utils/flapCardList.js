export const flapCardList = [
  {
    r: 255, // rgb值 - r
    g: 102, // rgb值 - g
    _g: 102, // 项目中通过修改 _g 的值修改颜色，如果需要还原设置，重复赋值 g 即可
    b: 159, // rgb值 - b
    imgLeft: 'url(' + require('@/assets/images/gift-left.png') + ')', // 图片左边部分
    imgRight: 'url(' + require('@/assets/images/gift-right.png') + ')', // 图片右边部分
    backgroundSize: '50% 50%', // 用于控制整个背景大小
    zIndex: 100, // 控制层级
    rotateDegree: 0 // 旋转角度，默认0
  },
  {
    r: 74,
    g: 171,
    _g: 171,
    b: 255,
    imgLeft: 'url(' + require('@/assets/images/compass-left.png') + ')',
    imgRight: 'url(' + require('@/assets/images/compass-right.png') + ')',
    backgroundSize: '50% 50%',
    zIndex: 99,
    rotateDegree: 0
  },
  {
    r: 255,
    g: 198,
    _g: 198,
    b: 102,
    imgLeft: 'url(' + require('@/assets/images/star-left.png') + ')',
    imgRight: 'url(' + require('@/assets/images/star-right.png') + ')',
    backgroundSize: '50% 50%',
    zIndex: 98,
    rotateDegree: 0
  },
  {
    r: 255,
    g: 102,
    _g: 102,
    b: 159,
    imgLeft: 'url(' + require('@/assets/images/heart-left.png') + ')',
    imgRight: 'url(' + require('@/assets/images/heart-right.png') + ')',
    backgroundSize: '50% 50%',
    zIndex: 97,
    rotateDegree: 0
  },
  {
    r: 59,
    g: 201,
    _g: 201,
    b: 22,
    imgLeft: 'url(' + require('@/assets/images/crown-left.png') + ')',
    imgRight: 'url(' + require('@/assets/images/crown-right.png') + ')',
    backgroundSize: '50% 50%',
    zIndex: 96,
    rotateDegree: 0
  }
]
