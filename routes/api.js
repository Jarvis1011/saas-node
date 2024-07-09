const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // 登录接口
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM Users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        return res.json({ success: false, message: '数据库查询错误' });
      }
      if (results.length > 0) {
        res.json({ success: true, user: { id: results[0].id, role: results[0].role } });
      } else {
        res.json({ success: false, message: '用户名或密码错误' });
      }
    });
  });

  // 休假申请提交接口
  router.post('/leave-requests', (req, res) => {
    const { user_id, start_date, end_date, reason } = req.body;
    const query = 'INSERT INTO LeaveRequests (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, "審核中")';
    db.query(query, [user_id, new Date(start_date), new Date(end_date), reason], (err, results) => {
      if (err) {
        return res.json({ success: false, message: '数据库插入错误' });
      }
      res.json({ success: true });
    });
  });

  // 获取休假申请接口
router.get('/leave-requests', (req, res) => {
  const userId = req.query.user_id; // 从查询参数获取用户ID
  const query = 'SELECT LeaveRequests.*, users.employee_name FROM LeaveRequests JOIN users ON LeaveRequests.user_id = users.id WHERE LeaveRequests.user_id = ?';

  db.query(query,[userId], (err, results) => {
    if (err) {
      return res.json({ success: false, message: '数据库查询错误' });
    }
    // 格式化日期时间字段为 ISO 字符串
    const formattedResults = results.map(result => ({
      ...result,
      start_date: result.start_date.toISOString(), // 这里的问题在于 result.start_date 可能为 null
      end_date: result.end_date.toISOString() // 同样的问题可能出现在 result.end_date
    }));
    res.json({ success: true, data: formattedResults }); 
  });
});

router.get('/leave-requests/manager', (req, res) => {
  const query = 'SELECT LeaveRequests.*, users.employee_name FROM LeaveRequests JOIN users ON LeaveRequests.user_id = users.id';

  db.query(query, (err, results) => {
    if (err) {
      return res.json({ success: false, message: '数据库查询错误' });
    }
    // 格式化日期时间字段为 ISO 字符串
    const formattedResults = results.map(result => ({
      ...result,
      start_date: result.start_date.toISOString(), // 这里的问题在于 result.start_date 可能为 null
      end_date: result.end_date.toISOString() // 同样的问题可能出现在 result.end_date
    }));
    res.json({ success: true, data: formattedResults }); 
  });
});


  // 更新休假申请状态接口
  router.post('/leave-requests/:id', (req, res) => {
    const requestId = parseInt(req.params.id);
    const { status, user_id } = req.body;

    // 查询用户角色
    const queryUserRole = 'SELECT role FROM Users WHERE id = ?';
    db.query(queryUserRole, [user_id], (err, results) => {
      if (err) {
        return res.json({ success: false, message: '数据库查询错误' });
      }

      const userRole = results[0].role;

      // 检查是否为经理角色
      if (userRole !== 'manager') {
        return res.json({ success: false, message: '权限不足' });
      }

      const queryUpdateStatus = 'UPDATE LeaveRequests SET status = ? WHERE id = ?';
      db.query(queryUpdateStatus, [status, requestId], (err, results) => {
        if (err) {
          return res.json({ success: false, message: '数据库更新错误' });
        }0
        res.json({ success: true })
      });
    });
  });

  return router;
};
