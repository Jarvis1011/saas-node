jQuery(document).ready(function($) {
  let userRole = '';
  let userId = ''; // 儲存用戶ID

  // 初始化日期時間選擇器
  let startDatePicker = null;
  let endDatePicker = null;
  const currentDateTime = new Date();
  function initializeDateTimePickers() {
    if (startDatePicker) {
      startDatePicker.destroy();
    }
    if (endDatePicker) {
      endDatePicker.destroy();
    }

    startDatePicker = $('#start_date').datetimepicker({
      format: 'Y-m-d H:i', // 設定時間格式
      step: 30, // 間隔30分鐘
      lang: 'zh', // 語言為中文
     
  allowInputToggle: false,// 禁止手动输入和切换输入框来显示日期时间选择器
  maskInput: true, // 使用输入掩码防止手动输入
      startDate: currentDateTime, // 設置開始日期為當前日期時間
      minDate: currentDateTime, // 設置最小日期為當前日期時間
      minTime:currentDateTime.getHours() + ':' + currentDateTime.getMinutes(),
      onShow: function(ct) {
        this.setOptions({
          minDate: currentDateTime, // 每次顯示時更新最小日期為當前日期時間
          minTime: currentDateTime.getHours() + ':' + currentDateTime.getMinutes() // 確保不能選擇比當前時間更早的小時和分鐘
        });
      }
    });

    endDatePicker = $('#end_date').datetimepicker({
      format: 'Y-m-d H:i', // 設定時間格式
      step: 30, // 間隔30分鐘
      lang: 'zh', // 語言為中文
      startDate: currentDateTime, // 設置開始日期為當前日期時間
      minDate: currentDateTime, // 設置最小日期為當前日期時間
      onShow: function(ct) {
        this.setOptions({
          minDate: startDatePicker.val() || currentDateTime, // 每次顯示時更新最小日期為開始日期或當前日期時間
          minTime: (startDatePicker.val() && startDatePicker.val().split(' ')[1]) || (currentDateTime.getHours() + ':' + currentDateTime.getMinutes()) // 確保不能選擇比開始時間更早的小時和分鐘
        });
      },
    });
  }

  initializeDateTimePickers(); // 初始化日期時間選擇器

  // 登入表單提交
  $('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const username = $('#username').val();
    const password = $('#password').val();

    $.post('/api/login', { username: username, password: password }, function(response) {
      if (response.success) {
        userRole = response.user.role; // 儲存用戶職稱
        userId = response.user.id; // 儲存用戶ID
        $('#login-form').hide();
        if (userRole === 'manager') {
          $('#leave-form').show();
          $('#leaveRequestForm').hide(); // 隐藏普通用户的申请表单
          managerLeaveRequests(); // 如果是经理角色，加载经理的申请列表
        } else {
          $('#leave-form').show();
          $('#operate').hide(); // 隐藏操作列
          loadLeaveRequests(); // 否则加载普通用户的申请列表
        }
      } else {
        alert('登录失败: ' + response.message);
      }
    });
  });

  // 當開始日期改變時更新結束日期的最小選擇日期
  $('#start_date').on('change', function() {
    if($('#start_date').val()){
   $('#end_date').prop('disabled', false);
    endDatePicker.datetimepicker('show'); // 显示结束日期时间选择器
    }else if($('#start_date').val() === ''){
       $('#end_date').val('');
       $('#end_date').prop('disabled', true);
    }
  });

  // 点击结束日期输入框时的处理
  $('#end_date').on('click', function() {
    if ($('#start_date').val() === '') {
      alert('請先選擇開始時間');
      $('#end_date').after('<span id="endTip" style="color:red;">請先選擇開始時間</span>');
      $('#end_date').val('');
    } else {
      $('#endTip').remove();
    }
  });

  // 休假申請表提交
  $('#leaveRequestForm').on('submit', function(e) {
    e.preventDefault();
    const startDate = $('#start_date').val();
    const endDate = $('#end_date').val();
    const reason = $('#reason').val();

    // 檢查結束時間是否早於開始時間或早於當前時間
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (endDateObj < startDateObj) {
      alert('结束时间不能早于开始时间或当前时间');
      return;
    }

    if (reason.length < 10) {
      $('.reasonTip').css('color', 'red').text('理由必须至少包含10个字');
      return;
    } else {
      $('.reasonTip').css('color', 'grey').text('文字請多於10字'); // 重置提示颜色
    }

    // 發送到後端的數據
    const requestData = {
      user_id: userId,
      start_date: startDate, // 直接使用開始日期的值
      end_date: endDate,
      reason: reason
    };

    $.post('/api/leave-requests', requestData, function(response) {
      if (response.success) {
        alert('申请提交成功');
  $('#reason').val('')
  $('#start_date').val('')
  $('#end_date').val('');
  $('#end_date').prop('disabled', true);
        if (userRole === 'manager') {
          managerLeaveRequests(); // 如果是经理角色，重新加载经理的申请列表
        } else {
          loadLeaveRequests(); // 否则重新加载普通用户的申请列表
        }
      } else {
        alert('提交失败: ' + response.message);
      }
    });
  });

  // 加載休假申請
  function loadLeaveRequests() {
    $.get('/api/leave-requests', { user_id: userId }, function(response) { // 添加 user_id 参数
      if (response.success) {
        const requestsTable = $('#requestsTable tbody');
        requestsTable.empty();
        response.data.forEach(function(request) {
          const row = $('<tr>');
          const formattedStartDate = formatDate(new Date(request.start_date));
          const formattedEndDate = formatDate(new Date(request.end_date));
          row.append($('<td>').text(request.employee_name));
          row.append($('<td>').text(formattedStartDate));
          row.append($('<td>').text(formattedEndDate));
          row.append($('<td>').text(request.reason));
          row.append($('<td>').text(request.status));
          if (request.status === '審核中' && userRole === 'manager') {
            const approveButton = $('<button>').text('批准').css({
  'margin-bottom': '10px'
}).on('click', function() {
              updateRequestStatus(request.id, '已通過');
            });
            const rejectButton = $('<button>').text('拒绝').on('click', function() {
              updateRequestStatus(request.id, '已拒絕');
            });
            row.append($('<td>').append(approveButton).append(rejectButton));
          } else if (userRole === 'manager') {
            row.append($('<td>').text('-'));
          }
          requestsTable.append(row);
        });
      } else {
        alert('加载申请失败: ' + response.message);
      }
    });
  }

  // 加載經理休假申請
  function managerLeaveRequests() {
    $.get('/api/leave-requests/manager', function(response) {
      if (response.success) {
        const requestsTable = $('#requestsTable tbody');
        requestsTable.empty();
        response.data.forEach(function(request) {
          const row = $('<tr>');
          const formattedStartDate = formatDate(new Date(request.start_date));
          const formattedEndDate = formatDate(new Date(request.end_date));
          row.append($('<td>').text(request.employee_name));
          row.append($('<td>').text(formattedStartDate));
          row.append($('<td>').text(formattedEndDate));
          row.append($('<td>').text(request.reason));
          row.append($('<td>').text(request.status));
          if (request.status === '審核中' && userRole === 'manager') {
            const approveButton = $('<button>').text('批准').addClass('td-class').on('click', function() {
              updateRequestStatus(request.id, '已通過');
            });
            const rejectButton = $('<button>').text('拒绝').on('click', function() {
              updateRequestStatus(request.id, '已拒絕');
            });
            row.append($('<td>').append(approveButton).append(rejectButton));
          } else if (userRole === 'manager') {
            row.append($('<td>').text('-'));
          }
          requestsTable.append(row);
        });
      } else {
        alert('加载申请失败: ' + response.message);
      }
    });
  }

  // 更新申請狀態
  function updateRequestStatus(requestId, status) {
    $.post('/api/leave-requests/' + requestId, { status: status, user_id: userId }, function(response) {
      if (response.success) {
        if (userRole === 'manager') {
          managerLeaveRequests(); // 如果是经理角色，重新加载经理的申请列表
        } else {
          loadLeaveRequests(); // 否则重新加载普通用户的申请列表
        }
      } else {
        alert('更新状态失败: ' + response.message);
      }
    });
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});
