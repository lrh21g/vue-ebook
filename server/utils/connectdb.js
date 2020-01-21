var config = require('../config');

// 初始化数据库连接 - MySQL
var mysql = require('mysql');

function connectdb () {
  var connect = mysql.createConnection({
    host: config.dbConfig.host,
    user: config.dbConfig.user,
    password: config.dbConfig.password,
    database: 'ebook'
  });
  return connect;
};

module.exports = connectdb;

