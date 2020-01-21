var express = require('express');
var router = express.Router();
var config = require('../config');
var connectdb = require('../utils/connectdb');
var voice = require('../utils/voice')

// 产生随机基数为 randomBase，长度为 len 的数组
var randomArray = function (len, randomBase) {
  let rand = [];
  for (let i = 0; i < len; i++) {
    rand.push(Math.floor(Math.random() * randomBase));
  }
  return rand;
};

var createCategoryIds = function (n) {
  const arr = [];
  const result = [];
  config.category.forEach((item, index) => {
    arr.push(index + 1);
  });
  for (let i = 0; i < n; i++) {
    const rand = Math.floor(Math.random() * (arr.length - i)); // 获取的随机数不能重复
    result.push(arr[rand]); // 获取分类对应的序号
    arr[rand] = arr[arr.length - i -1]; // 将已经获取的随机数取代，用最后一位数
  }
  return result;
};

// 创建 书城首页 - 类目列表 书籍详情数据（模拟）
var createCategoryData = function (data) {
  const categoryIds = createCategoryIds(6);
  const result = [];
  categoryIds.forEach(categoryId => {
    const subList = data.filter(item => item.category === categoryId).slice(0, 4);
    subList.map(item => {
      return handleData(item);
    });
    result.push({
      category: categoryId,
      list: subList
    });
  })
  return result.filter(item => item.list.length === 4);
};

// 创建 书城首页 - 猜你喜欢 书籍详情数据（模拟）
var createGuessYouLike = function (data) {
  const n = parseInt(randomArray(1, 3)) + 1;
  data['type'] = n;
  switch (n) {
    case 1:
      data['result'] = data.id % 2 === 0 ? '《Executing Magic》' : '《Elements Of Robotics》';
      break;
    case 2:
      data['result'] = data.id % 2 === 0 ? '《Improving Psychiatric Care》' : '《Programming Languages》';
      break;
    case 3:
      data['result'] = '《Living with Disfigurement》';
      data['percent'] = data.id % 2 === 0 ? '92%' : '97%';
      break;
  }
  return data;
};

// 创建 书城首页 - 推荐阅读 书籍阅读人数数据（模拟）
var createRecommendData = function (data) {
  data['readers'] = Math.floor(data.id / 2 * randomArray(1, 100))
  return data
}

// 根据 key，从 result 中取出对应数据
var createData = function (result, key) {
  return handleData(result[key]);
};

// 数据处理
var handleData = function (data) {
  if (!data.cover.startsWith('http://')) {
    data['cover'] = `${config.resUrl}/img${data.cover}`; // 封面
  }
  data['selected'] = false; // 是否选择
  data['private'] = false; // 是否为私密阅读
  data['cache'] = false; // 是否已缓存
  data['haveRead'] = 0; // 是否阅读
  return data;
};

// 书籍商城主页接口
router.get('/home', (req, res, next) => {
  const connect = connectdb();
  connect.query('select * from book where cover != \'\'', (err, result) => {
    if (err) {
      console.log('home err', err);
      res.json({
        code: 1,
        msg: '获取失败'
      });
      return;
    }
    const length = result.length;
    const guessYouLike = [];
    const banner = config.resUrl + '/home_banner2.jpg';
    const recommend = [];
    const featured = [];
    const random = [];
    const categoryList = createCategoryData(result);
    const categories = config.categories;
    randomArray(9, length).forEach(key => {
      guessYouLike.push(createGuessYouLike(createData(result, key)))
    });
    randomArray(3, length).forEach(key => {
      recommend.push(createRecommendData(createData(result, key)))
    });
    randomArray(6, length).forEach(key => {
      featured.push(createData(result, key))
    });
    randomArray(1, length).forEach(key => {
      random.push(createData(result, key))
    });
    res.json({
      guessYouLike,
      banner,
      recommend,
      featured,
      categoryList,
      categories,
      random
    });
    connect.end();
  });
});

// 获取书籍详情
router.get('/detail', (req, res, next) => {
  const connect = connectdb();
  const fileName = req.query.fileName
  const sql = `select * from book where fileName='${fileName}'`;
  connect.query(sql, (err, result) => {
    if (err) {
      res.json({
        code: 1,
        msg: '电子书详情获取失败'
      });
      return;
    }
    if (result && result.length === 0) {
      res.json({
        code: 1,
        msg: '电子书获取详情失败'
      });
    } else {
      const book = handleData(result[0]);
      res.json({
        code: 0,
        msg: '获取成功',
        data: book
      });
    }
  })
  connect.end();
});

// 分类列表接口
router.get('/list', function(req, res, next) {
  const connect = connectdb();
  connect.query('select * from book where cover != \'\'', (err, result) => {
    if (err) {
      console.log('list err', err);
      res.json({
        code: 1,
        msg: '获取失败'
      });
      return;
    }
    result.map(item => handleData(item));
    const data = {};
    config.category.forEach(categoryText => {
      data[categoryText] = result.filter(item => item.categoryText === categoryText);
    })
    res.json({
      code: 0,
      msg: '获取成功',
      data: data,
      total: result.length
    });
    connect.end();
  })
});

router.get('/flat-list', (req, res, next) => {
  const connect = connectdb();
  connect.query('select * from book where cover!=\'\'', (err, result) => {
    if (err) {
      res.json({
        code: 1,
        msg: '获取失败'
      });
    } else {
      result.map(item => handleData(item));
      res.json({
        code: 0,
        msg: '获取成功',
        data: result,
        total: result.length
      });
    }
    connect.end()
  })
});

router.get('/shelf', (req, res, next) => {
  res.json({
    code: 0,
    bookList: []
  });
});

router.get('/voice', (req, res, next) => {
  voice(req, res)
})

module.exports = router;
