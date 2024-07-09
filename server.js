const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');  // 使用 mysql2
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();
const port = 3000;

// 配置数据库连接
const db = mysql.createConnection(config.database);

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api', apiRoutes(db));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
