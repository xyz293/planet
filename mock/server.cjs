const jsonServer = require('json-server')
const path = require('path')
const fs = require('fs')
const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const SECRET_KEY = 'your_secret_key'
const expiresIn = '1h'

server.use(middlewares)
server.use(bodyParser.json())

// 确保 db.json 文件有基础结构
const dbFilePath = path.join(__dirname, 'db.json')
if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, JSON.stringify({ users: [], codes: [], courses: [], enterpriseNeeds: [] }, null, 2))
}

// 每次请求都刷新最新数据库（避免缓存）
server.use((req, res, next) => {
  router.db.read()
  next()
})

// 生成 Token
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

// 验证 Token 中间件
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '缺少Token或格式错误' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' })
  }
}

// 生成较小的ID，避免过大数字
const generateId = () => Date.now() % 1000000000

// 发送验证码接口
server.get('/user/sendCode', (req, res) => {
  const { phone } = req.query
  if (!phone) return res.status(400).json({ success: false, message: '缺少手机号' })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  router.db.get('codes').push({ phone, code }).write()

  res.json({ success: true, message: '验证码发送成功', code })
})
server.post('/enrollment',  (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    // 身份验证：必须是学生
    const user = router.db.get('users').find({ id: req.user.id, role: 'student' }).value();
    if (!user) {
      return res.status(403).json({ success: false, message: '仅限学生操作' });
    }

    // 参数校验
    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, message: '缺少 studentId 或 courseId' });
    }

    // 确保为本人选课
    if (studentId !== user.id) {
      return res.status(403).json({ success: false, message: '禁止为他人选课' });
    }

    // 检查学生和课程是否存在
    const student = router.db.get('users').find({ id: studentId, role: 'student' }).value();
    const course = router.db.get('courses').find({ id: Number(courseId) }).value();

    if (!student) return res.status(404).json({ success: false, message: '学生不存在' });
    if (!course) return res.status(404).json({ success: false, message: '课程不存在' });

    // 检查是否已选
    const existing = router.db.get('enrollments')
      .find({ studentId, courseId: Number(courseId) })
      .value();
    if (existing) {
      return res.status(400).json({ success: false, message: '您已选过该课程' });
    }

    // 创建新记录
    const newEnrollment = {
      id: generateId(),
      studentId,
      courseId: Number(courseId),
      status: 'enrolled',
      enrollTime: new Date().toISOString(),
    };

    // 写入数据库
    router.db.get('enrollments').push(newEnrollment).write();
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

    res.status(201).json({
      success: true,
      message: '选课成功',
       newEnrollment
    });
  } catch (error) {
    console.error('选课失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
server.delete('/enrollment/:id',  (req, res) => {
  try {
    const id = Number(req.params.id);
    const enrollment = router.db.get('enrollments').find({ id }).value();

    if (!enrollment) {
      return res.status(404).json({ success: false, message: '选课记录不存在' });
    }

    const user = router.db.get('users').find({ id: req.user.id, role: 'student' }).value();
    if (!user || enrollment.studentId !== user.id) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    router.db.get('enrollments').remove({ id }).write();
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

    res.json({ success: true, message: '已取消选课' });
  } catch (error) {
    console.error('取消选课失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
server.get('/enrollment/my',  (req, res) => {
  try {
    const user = router.db.get('users').find({ id: req.user.id, role: 'student' }).value();
    if (!user) return res.status(403).json({ success: false, message: '仅限学生访问' });

    const enrollments = router.db.get('enrollments')
      .filter({ studentId: user.id })
      .map(enrollment => {
        const course = router.db.get('courses').find({ id: enrollment.courseId }).value();
        return course ? { ...enrollment, course } : enrollment;
      })
      .value();

    res.json({
      success: true,
      message: '获取选课列表成功',
      data: enrollments
    });
  } catch (error) {
    console.error('获取选课列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
server.get('/enrollment/available',  (req, res) => {
  try {
    const user = router.db.get('users').find({ id: req.user.id, role: 'student' }).value();
    if (!user) return res.status(403).json({ success: false, message: '仅限学生访问' });

    const enrolledCourseIds = router.db.get('enrollments')
      .filter({ studentId: user.id })
      .map(e => e.courseId)
      .value();

    const availableCourses = router.db.get('courses')
      .filter(course => !enrolledCourseIds.includes(course.id))
      .value();

    res.json({
      success: true,
      message: '可选课程获取成功',
       availableCourses
    });
  } catch (error) {
    console.error('获取可选课程失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});


// 注册接口
server.post('/user/regist', (req, res) => {
  const { phone, password, code } = req.body
  if (!phone || !password || !code) {
    return res.status(400).json({ success: false, message: '缺少参数' })
  }

  const codes = router.db.get('codes').value()
  const validCode = codes.find(c => c.code === code && c.phone === phone)
  if (!validCode) {
    return res.status(400).json({ success: false, message: '验证码无效或已过期' })
  }

  const users = router.db.get('users')
  const exists = users.find({ phone }).value()
  if (exists) {
    return res.status(400).json({ success: false, message: '手机号已注册' })
  }

  const newUser = {
    id: generateId(),
    phone,
    password,
  }
  users.push(newUser).write()

  // 删除已用验证码
  router.db.get('codes').remove(c => c.code === code && c.phone === phone).write()

  // 强制保存文件
  fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2))

  const token = createToken({ id: newUser.id, phone: newUser.phone })
  res.json({ success: true, message: '注册成功', user: newUser, token })
})
server.post('/user/setRole', (req, res) => {
  const { id, role } = req.body;

  if (!id || !role) {
    return res.status(400).json({ success: false, message: '缺少用户ID或身份role参数' });
  }

  const validRoles = ['student', 'enterprise', 'university'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: '身份role参数无效' });
  }

  const users = router.db.get('users');
  const user = users.find({ id }).value();

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  // 更新用户身份字段
  users.find({ id }).assign({ role }).write();

  res.json({ success: true, message: '用户身份设置成功', data: { id, role } });
});
// 登录接口
server.post('/user/login', (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '缺少参数' })
  }

  const users = router.db.get('users')
  const user = users.find({ phone, password }).value()
  if (!user) {
    return res.status(400).json({ success: false, message: '手机号或密码错误' })
  }

  const token = createToken({ id: user.id, phone: user.phone })
  res.json({ success: true, message: '登录成功', user, token })
})
server.get('/course/my-status', (req, res) => {
  const userIdRaw = req.query.userId;
  if (!userIdRaw) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }
  const userId = Number(userIdRaw);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: '用户ID格式错误' });
  }

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user || user.role !== 'student') {
    return res.status(404).json({ success: false, message: '用户不存在或非学生' });
  }

  // 获取该学生的选课记录（包含未完成的）
  const enrollments = router.db.get('enrollments')
    .filter({ userId })
    .value();

  const courses = router.db.get('courses').value();
  const courseMap = new Map(courses.map(c => [c.id, c]));

  const result = enrollments.map(enroll => {
    const course = courseMap.get(enroll.courseId);
    if (!course) {
      return null;
    }

    const passed = enroll.grade !== null && enroll.grade >= 60;
    const creditsEarned = enroll.status === 'completed' && passed ? course.credits : 0;

    return {
      courseId: course.id,
      courseCode: course.courseCode,
      name: course.name,
      department: course.department,
      teacher: course.teacher,
      credits: course.credits,
      schedule: course.schedule,
      location: course.location,

      enrollmentStatus: enroll.status,         // enrolled / completed
      grade: enroll.grade,                     // null 表示未出成绩
      passed: enroll.grade !== null ? passed : null,
      creditsEarned,

      // 新增状态标签（前端友好）
      statusText: enroll.status === 'completed' 
        ? (passed ? '已通过，学分已获得' : '未通过，需重修') 
        : '学习中，成绩未出'
    };
  }).filter(Boolean); // 过滤无效课程

  res.json({
    success: true,
    data: {
      userId: user.id,
      name: user.name,
      courseCount: result.length,
      completedCount: result.filter(c => c.enrollmentStatus === 'completed').length,
      passedCount: result.filter(c => c.passed === true).length,
      totalCreditsEarned: result.reduce((sum, c) => sum + c.creditsEarned, 0),
      courses: result
    }
  });
});
server.get('/course/:id/my', (req, res) => {
  const userIdRaw = req.query.userId;
  const courseIdRaw = req.params.id;

  if (!userIdRaw) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }
  if (!courseIdRaw) {
    return res.status(400).json({ success: false, message: '缺少课程ID' });
  }

  const userId = Number(userIdRaw);
  const courseId = Number(courseIdRaw);

  if (isNaN(userId) || isNaN(courseId)) {
    return res.status(400).json({ success: false, message: '参数格式错误' });
  }

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user || user.role !== 'student') {
    return res.status(404).json({ success: false, message: '用户不存在或非学生' });
  }

  // 查找该学生对该课程的选课记录
  const enrollment = router.db.get('enrollments')
    .find({ userId, courseId })
    .value();

  const course = router.db.get('courses').find({ id: courseId }).value();
  if (!course) {
    return res.status(404).json({ success: false, message: '课程不存在' });
  }

  let statusInfo = null;

  if (enrollment) {
    const passed = enrollment.grade !== null && enrollment.grade >= 60;
    const creditsEarned = enrollment.status === 'completed' && passed ? course.credits : 0;

    statusInfo = {
      enrolled: true,
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      grade: enrollment.grade,
      passed: enrollment.grade !== null ? passed : null,
      creditsEarned,
      statusText: enrollment.status === 'completed'
        ? (passed ? '✅ 已通过，学分已获得' : '❌ 未通过，需重修')
        : '🟡 学习中，成绩尚未发布',
      semester: enrollment.semester
    };
  } else {
    statusInfo = {
      enrolled: false,
      grade: null,
      passed: false,
      creditsEarned: 0,
      statusText: '📘 未选修该课程'
    };
  }

  res.json({
    success: true,
    data: {
      course: {
        id: course.id,
        courseCode: course.courseCode,
        name: course.name,
        department: course.department,
        teacher: course.teacher,
        credits: course.credits,
        schedule: course.schedule,
        location: course.location,
        description: course.description
      },
      myStatus: statusInfo
    }
  });
});

// 获取用户信息接口
// 修改您现有的 /user/info 接口
server.get('/user/info', (req, res) => {
  const userIdRaw = req.query.id
  if (!userIdRaw) {
    return res.status(400).json({ success: false, message: '缺少用户ID' })
  }
  const userId = Number(userIdRaw)
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: '用户ID格式错误' })
  }
  const users = router.db.get('users')
  const user = users.find({ id: userId }).value()
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  // 👇 为学生角色添加学业信息
  let studentInfo = {};
  if (user.role === 'student') {
    // 默认毕业所需学分，也可以存储在数据库里
    const requiredCredits = user.requiredCredits || 120; 
    // 计算毕业状态
    const isGraduated = user.credits >= requiredCredits && user.tuitionPaid === true;

    studentInfo = {
      credits: user.credits || 0,           // 已获学分
      requiredCredits,                      // 毕业所需学分
      tuition: user.tuition || 0,           // 学费总额
      tuitionPaid: user.tuitionPaid || false, // 学费是否缴清
      graduationEligible: isGraduated      // 是否满足毕业资格
    };
  }

  // 👇 将学业信息合并到返回数据中
  const { id, phone, name, age, education, major, university, role } = user;
  res.json({
    success: true,
    data: { 
      id, 
      phone, 
      name, 
      age, 
      education, 
      major, 
      university, 
      role,
      ...studentInfo // 学生专属信息
    }
  })
})
// 新增接口：学生缴纳学费
server.post('/payment/tuition', (req, res) => {
  try {
    const { user } = req; // 从 verifyToken 中间件获取的用户信息

    // 1️⃣ 身份验证：必须是学生
    if (user.role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: '仅限学生用户操作' 
      });
    }

    // 2️⃣ 查找用户
    const users = router.db.get('users');
    const currentUser = users.find({ id: user.id }).value();
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    // 3️⃣ 模拟缴费逻辑
    // 假设学费金额在用户数据中已定义，例如 user.tuition = 50000
    const tuitionAmount = currentUser.tuition || 50000; // 默认5万

    // 🚨 这里是模拟！真实场景应对接支付平台
    console.log(`[模拟支付] 学生 ${currentUser.name} 正在缴纳 ${tuitionAmount} 元学费...`);

    // 4️⃣ 更新用户状态：标记为已缴费
    users.find({ id: user.id }).assign({ 
      tuitionPaid: true 
    }).write();

    // 5️⃣ 强制保存
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

    res.json({ 
      success: true, 
      message: `学费缴纳成功！金额：${tuitionAmount} 元`, 
      data: { 
        tuitionPaid: true, 
        amount: tuitionAmount 
      } 
    });

  } catch (error) {
    console.error('缴纳学费失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});
// 新增接口：获取学生的学分记录
server.get('/credit/records', (req, res) => {
  try {
    const { user } = req;
    const { studentId } = req.query; // 可以查自己的，或高校查指定学生

    // 1️⃣ 身份验证
    if (user.role === 'student') {
      // 学生只能查自己的
      if (studentId && Number(studentId) !== user.id) {
        return res.status(403).json({ 
          success: false, 
          message: '无权查询其他学生的记录' 
        });
      }
      const records = router.db.get('creditRecords')
        .filter({ studentId: user.id })
        .orderBy('grantedAt', 'desc')
        .value();
      return res.json({ success: true, data: records });
    } 
    else if (user.role === 'university') {
      // 高校可以查自己学校所有学生的记录
      // 这里需要一个逻辑：如何关联学生和高校？假设学生有 university 字段
      if (!studentId) {
        return res.status(400).json({ 
          success: false, 
          message: '高校用户需提供 studentId' 
        });
      }
      const records = router.db.get('creditRecords')
        .filter({ studentId: Number(studentId) })
        .value();
      return res.json({ success: true, data: records });
    } 
    else {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

  } catch (error) {
    console.error('获取学分记录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});
// 新增接口：高校为学生添加学分（录入成绩后）
server.post('/credit/add', (req, res) => {
  try {
    const { user } = req;
    const { studentId, courseName, creditsEarned } = req.body;

    // 1️⃣ 身份验证：必须是高校用户
    if (user.role !== 'university') {
      return res.status(403).json({ 
        success: false, 
        message: '仅限高校用户操作' 
      });
    }

    // 2️⃣ 参数校验
    if (!studentId || !courseName || creditsEarned === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少 studentId, courseName 或 creditsEarned 参数' 
      });
    }

    // 3️⃣ 查找学生
    const users = router.db.get('users');
    const student = users.find({ id: Number(studentId), role: 'student' }).value();
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: '学生不存在或非学生身份' 
      });
    }

    // 4️⃣ 计算新的总学分
    const currentCredits = student.credits || 0;
    const newTotalCredits = currentCredits + Number(creditsEarned);

    // 5️⃣ 更新学生学分
    users.find({ id: Number(studentId) }).assign({ 
      credits: newTotalCredits 
    }).write();

    // 6️⃣ 记录学分变更日志（可选）
    const creditRecord = {
      id: generateId(),
      studentId: Number(studentId),
      courseName,
      creditsEarned: Number(creditsEarned),
      grantedBy: user.university, // 记录是哪个学校授予的
      grantedAt: new Date().toISOString()
    };
    router.db.get('creditRecords').push(creditRecord).write(); // 假设有 creditRecords 表

    // 7️⃣ 强制保存
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

    res.json({ 
      success: true, 
      message: '学分录入成功', 
      data: { 
        studentId: Number(studentId),
        courseName,
        creditsEarned: Number(creditsEarned),
        totalCredits: newTotalCredits
      } 
    });

  } catch (error) {
    console.error('录入学分失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});


// 获取课程列表
server.get('/course/page', (req, res) => {
  const courses = router.db.get('courses').value()
  res.json({ success: true, courses })
})

// 新增课程
server.post('/course', (req, res) => {
  const newCourse = req.body
  newCourse.id = generateId()
  router.db.get('courses').push(newCourse).write()
  res.json({ success: true, course: newCourse })
})
// 根据多个字段筛选课程（模糊搜索）
server.get('/course/search', (req, res) => {
  const { university, title, teacher } = req.query;

  let courses = router.db.get('courses').value();

  if (university) {
    courses = courses.filter(course => course.university === university);
  }

  if (title) {
    courses = courses.filter(course => course.title.includes(title));
  }

  if (teacher) {
    courses = courses.filter(course => course.teacher.includes(teacher));
  }

  res.json({ success: true, data: courses });
});
// 获取高校列表接口
server.get('/university/list', (req, res) => {
  const courses = router.db.get('courses').value();
  const universities = router.db.get('universities').value();

  const universitiesSet = new Set(courses.map(course => course.university));
  const filteredUniversities = universities.filter(u => universitiesSet.has(u.name));

  console.log(`返回学校数: ${filteredUniversities.length}`);
  res.json({ success: true, data: filteredUniversities });
});

// 支持多字段查询职业规划接口
server.get('/careerPlan/search', (req, res) => {
  const { major, position, skill } = req.query;

  let plans = router.db.get('careerPlans').value();

  if (major) {
    plans = plans.filter(p => p.major.includes(major));
  }

  if (position) {
    plans = plans.filter(p =>
      p.recommendedPositions.some(pos => pos.includes(position))
    );
  }

  if (skill) {
    plans = plans.filter(p =>
      p.skillsRequired.some(s => s.includes(skill))
    );
  }

  res.json({ success: true, data: plans });
});
server.get('/resources', (req, res) => {
  const resources = router.db.get('resources').value()
  res.json({ success: true, data: resources })
})
// 编辑企业信息
server.put('/enterprise/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = router.db;
  const enterprise = db.get('enterprises').find({ id }).value();

  if (!enterprise) {
    return res.status(404).json({ success: false, message: '企业不存在' });
  }

  db.get('enterprises').find({ id }).assign(req.body).write();

  res.json({ success: true, message: '企业信息更新成功', data: req.body });
});

// 发布相关招聘
server.post('/jobs/:enterpriseId', (req, res) => {
  const enterpriseId = Number(req.params.enterpriseId);
  const db = router.db;

  const newJob = {
    id: Date.now()%12368,
    enterpriseId,
    ...req.body
  };

  db.get('jobs').push(newJob).write();

  res.json({ success: true, message: '招聘信息发布成功', data: newJob });
});

// 添加企业资源
server.post('/resources/:enterpriseId', (req, res) => {
  const enterpriseId = Number(req.params.enterpriseId);
  const db = router.db;

  const newResource = {
    id: Date.now()%12368,
    enterpriseId,
    ...req.body
  };

  db.get('resources').push(newResource).write();

  res.json({ success: true, message: '资源添加成功', data: newResource });
});

// 获取企业资源
server.get('/resources/:enterpriseId', (req, res) => {
  const enterpriseId = Number(req.params.enterpriseId);
  const db = router.db;

  const resources = db.get('resources').filter({ enterpriseId }).value();

  res.json({ success: true, data: resources });
});

// 查看对口人才（技能匹配）
server.get('/match-talents/:enterpriseId', (req, res) => {
  const enterpriseId = Number(req.params.enterpriseId);
  const db = router.db;

  const jobs = db.get('jobs').filter({ enterpriseId }).value();
  const allSkills = new Set(jobs.flatMap(job => job.requiredSkills || []));

  const talents = db.get('talents').filter(talent =>
    (talent.skills || []).some(skill => allSkills.has(skill))
  ).value();

  res.json({ success: true, data: talents });
});

server.post('/students', (req, res) => {
  const db = router.db;

  const newStudent = {
    id: Date.now()%12368, // 简单用时间戳做ID
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    age: req.body.age,
    gender: req.body.gender,
    education: req.body.education,
    university: req.body.university,
    major: req.body.major,
    skills: req.body.skills || [],
    experience: req.body.experience || '',
    resumeUrl: req.body.resumeUrl || '',
    expectedJob: req.body.expectedJob || '',
    expectedSalary: req.body.expectedSalary || '',
    location: req.body.location || '',
    portfolioUrl: req.body.portfolioUrl || '',
    selfIntro: req.body.selfIntro || '',
    status: req.body.status || '找工作中',
    createTime: new Date().toISOString()
  };

  db.get('students').push(newStudent).write();

  res.json({ success: true, message: '学生简历提交成功', data: newStudent });
});
server.put('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = router.db;

  const student = db.get('students').find({ id }).value();

  if (!student) {
    return res.status(404).json({ success: false, message: '学生不存在' });
  }

  db.get('students')
    .find({ id })
    .assign(req.body)
    .write();

  res.json({ success: true, message: '学生简历信息更新成功', data: req.body });
});
server.get('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = router.db;

  const student = db.get('students').find({ id }).value();

  if (!student) {
    return res.status(404).json({ success: false, message: '学生不存在' });
  }

  res.json({ success: true, data: student });
});

// 📬 学生发送求职意向
server.post('/application/submit', (req, res) => {
  const { studentId, jobId } = req.body;

  if (!studentId || !jobId) {
    return res.status(400).json({ error: 'studentId 和 jobId 是必填' });
  }

  const dbFile = path.join(__dirname, 'db.json');
  let db;

  try {
    db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  } catch (err) {
    return res.status(500).json({ error: '读取数据库失败' });
  }

  if (!Array.isArray(db.applications)) {
    db.applications = [];
  }

  // 自动生成唯一 id（当前最大 id + 1）
  const maxId = db.applications.length > 0
    ? Math.max(...db.applications.map(app => app.id))
    : 1000;
  const newId = maxId + 1;

  const newApplication = {
    id: newId,
    studentId,
    jobId,
    status: '待处理',
    timestamp: new Date().toISOString()
  };

  db.applications.push(newApplication);

  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (err) {
    return res.status(500).json({ error: '写入数据库失败' });
  }

  res.status(201).json(newApplication);
});


server.get('/enterprise-need/:id', (req, res) => {
  const needId = Number(req.params.id); // 获取路径参数
  const db = router.db;

  // 1️⃣ 从 enterpriseNeeds 数组中查找指定 ID 的需求
  const enterpriseNeed = db.get('enterpriseNeeds').find({ id: needId }).value();

  if (!enterpriseNeed) {
    return res.status(404).json({ 
      success: false, 
      message: '企业招聘需求不存在' 
    });
  }

  // 2️⃣ 查找对应的 jobDetail (如果存在)
  // 如果 enterpriseNeed 中已经有 jobDetail，直接使用
  let jobDetail = enterpriseNeed.jobDetail;

  // 如果没有，尝试从 jobs 表中查找并构建
  if (!jobDetail) {
    const job = db.get('jobs').find({ 
      enterpriseId: enterpriseNeed.enterpriseId, 
      title: enterpriseNeed.position 
    }).value();

    if (job) {
      // 从 users 表获取企业名称
      const enterprise = db.get('users').find({ 
        id: job.enterpriseId, 
        role: 'enterprise' 
      }).value();
      const companyName = enterprise ? enterprise.name : '未知公司';

      // 构建 jobDetail 对象
      jobDetail = {
        id: job.id,
        enterpriseId: job.enterpriseId,
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills,
        salary: job.salary,
        location: job.location,
        company: companyName // 如果需要，也可以加上公司名
      };
    }
    // 如果 job 也找不到，jobDetail 将保持为 null
  }

  // 3️⃣ 构造最终返回的数据
  // 将查询到的 jobDetail 覆盖到原始数据上，确保是最新的
  const responseData = {
    ...enterpriseNeed,
    jobDetail: jobDetail // 这里可能是 null
  };

  // 4️⃣ 返回成功响应
  res.json({ 
    success: true, 
     responseData 
  });
});
// 📥 学生查看自己的求职记录
server.get('/application/my', (req, res) => {
  try {
    const userIdRaw = req.query.id;
    if (!userIdRaw) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }
    const userId = Number(userIdRaw);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' });
    }

    const db = router.db;
    const user = db.get('users').find({ id: userId, role: 'student' }).value();
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在或非学生身份' });
    }

    // 取出该学生所有申请
    const applications = db.get('applications').filter({ studentId: userId }).value() || [];

    // 去重，保留第一个申请，按 jobId 去重
    const uniqueAppsMap = new Map();
    applications.forEach(app => {
      if (!uniqueAppsMap.has(app.jobId)) {
        uniqueAppsMap.set(app.jobId, app);
      }
    });
    const uniqueApplications = Array.from(uniqueAppsMap.values());

    res.json({ success: true, data: uniqueApplications });
  } catch (error) {
    console.error('查询求职记录异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});
// 假设 enterpriseNeeds 是数组，已加载在内存

server.get('/jobs', (req, res) => {
  try {
    const enterpriseId = Number(req.query.enterpriseId);

    if (!enterpriseId || isNaN(enterpriseId)) {
      return res.status(400).json({ message: '缺少或无效的 enterpriseId' });
    }

    // ✅ 正确方式：从 json-server 的 db 中获取 enterpriseNeeds
    const db = router.db;
    const enterpriseNeeds = db.get('enterpriseNeeds').value();

    // 查找企业
    const company = enterpriseNeeds.find(item => item.enterpriseId === enterpriseId);

    if (!company) {
      return res.status(404).json({ message: '企业未找到' });
    }

    // 获取 jobDetails，确保是数组
    const jobDetails = Array.isArray(company.jobDetails) ? company.jobDetails : [];

    // ✅ 直接返回 jobDetails 数组
    res.json(jobDetails);

  } catch (error) {
    console.error('💥 /jobs 接口错误:', error.message);
    res.status(500).json({ message: '服务器内部错误' });
  }
});
// 接口2: 根据岗位 id 查询单个岗位详情
// ✅ 接口1: 根据岗位 id 查询单个岗位详情
server.get('/job/:id', (req, res) => {
  try {
    const jobId = Number(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID'
      });
    }

    // ✅ 从 json-server 数据库读取 enterpriseNeeds
    const db = router.db;
    const enterpriseNeeds = db.get('enterpriseNeeds').value();

    // 扁平化所有 jobDetails 并查找
    const job = enterpriseNeeds
      .flatMap(company => company.jobDetails || [])
      .find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: '岗位未找到'
      });
    }

    return res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('💥 /job/:id 错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});
// 📈 学生查看岗位详情时，增加浏览量
server.post('/job/:id/view', (req, res) => {
  try {
    const jobId = Number(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID'
      });
    }

    const db = router.db;

    const enterpriseNeeds = db.get('enterpriseNeeds').value();
    let targetJob = null;
    let targetCompany = null;

    for (const company of enterpriseNeeds) {
      if (Array.isArray(company.jobDetails)) {
        // 注意这里改成 jobId 比较
        targetJob = company.jobDetails.find(j => j.jobId === jobId);
        if (targetJob) {
          targetCompany = company;
          break;
        }
      }
    }

    if (!targetJob) {
      return res.status(404).json({
        success: false,
        message: '岗位未找到'
      });
    }

    if (typeof targetJob.views === 'undefined') {
      targetJob.views = 0;
    }

    targetJob.views += 1;

    const jobIndex = targetCompany.jobDetails.findIndex(j => j.jobId === jobId);
    targetCompany.jobDetails[jobIndex] = targetJob;

    db.get('enterpriseNeeds')
      .find({ id: targetCompany.id })
      .assign(targetCompany)
      .write();

    return res.json({
      success: true,
      message: '浏览量已增加',
      data: {
        jobId: targetJob.jobId,
        views: targetJob.views
      }
    });

  } catch (error) {
    console.error('记录浏览量失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});
// 🛰️ 聊天系统 API

// 生成唯一 ID（简单版）
const generateChatId = () => (Date.now() % 1000000000).toString();

// 获取会话 ID（conv_studentId_enterpriseId）
const getConversationId = (studentId, enterpriseId) => `conv_${studentId}_${enterpriseId}`;

// 🔹 1. 获取当前用户的聊天会话列表
server.get('/api/chat/student/:studentId/conversations', (req, res) => {
  try {
    const { studentId } = req.params;
    const db = router.db;

    const sid = Number(studentId);
    if (isNaN(sid)) {
      return res.status(400).json({
        success: false,
        message: 'studentId 必须是有效数字'
      });
    }

    // 1. 检查学生是否存在
    const student = db.get('users').find({ id: sid, role: 'student' }).value();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生用户不存在'
      });
    }

    // 2. 找出该学生参与的所有会话
    const conversations = db.get('chatConversations')
      .filter({ studentId: sid })
      .value()
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    // 3. 补充每个会话对应的企业信息
    const result = conversations.map(conv => {
      const enterprise = db.get('enterprises').find({ id: conv.enterpriseId }).value();

      return {
        ...conv,
        enterprise: enterprise
          ? {
              id: enterprise.id,
              name: enterprise.name || '未知企业',
              logo: enterprise.logo || null
            }
          : {
              id: null,
              name: '已删除企业',
              logo: null
            }
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('【服务器错误】查询学生会话失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
      error: error.message
    });
  }
});
server.get('/api/chat/enterprise/:enterpriseId/conversations', (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const db = router.db;

    const eid = Number(enterpriseId);
    if (isNaN(eid)) {
      return res.status(400).json({
        success: false,
        message: 'enterpriseId 必须是有效数字'
      });
    }

    // 1. 检查企业是否存在
    const enterprise = db.get('enterprises').find({ id: eid }).value();
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: '企业不存在'
      });
    }
    server.get('/achievements', (req, res) => {
  try {
    const { type } = req.query;
    let achievements = router.db.get('achievements').value();
    
    // 如果提供了 type 参数，则进行筛选
    if (type) {
      achievements = achievements.filter(item => item.type === type);
    }
    
    res.json({ 
      success: true, 
      data: achievements 
    });
  } catch (error) {
    console.error('获取成果列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * GET /achievements/:id
 * 获取单个成果详情
 */
server.get('/achievements/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const achievement = router.db.get('achievements').find({ id }).value();
    
    if (!achievement) {
      return res.status(404).json({ 
        success: false, 
        message: '成果不存在' 
      });
    }
    
    res.json({ 
      success: true, 
      data: achievement 
    });
  } catch (error) {
    console.error('获取成果详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * POST /achievements
 * 发布新的成果
 * 请求体 (Body) 示例:
 * {
 *   "title": "基于AI的智能招聘系统",
 *   "type": "project", // research | project | report
 *   "author": "清华大学",
 *   "publishDate": "2023-10-01",
 *   "description": "项目描述...",
 *   "url": "/files/project1.pdf"
 * }
 */
server.post('/achievements', verifyToken, (req, res) => {
  try {
    const { title, type, author, publishDate, description, url } = req.body;
    
    // 验证必要字段
    if (!title || !type || !author) {
      return res.status(400).json({ 
        success: false, 
        message: '标题、类型和作者为必填项' 
      });
    }
    
    // 验证成果类型
    const validTypes = ['research', 'project', 'report'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: '成果类型无效，应为 research, project, report 之一' 
      });
    }
    
    const newAchievement = {
      id: generateId(), // 使用您代码中已有的 generateId 函数
      title,
      type,
      author,
      publishDate: publishDate || new Date().toISOString().split('T')[0],
      description: description || '',
      url: url || '',
      createTime: new Date().toISOString()
    };
    
    // 写入数据库
    router.db.get('achievements').push(newAchievement).write();
    // 强制同步保存文件
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));
    
    res.status(201).json({ 
      success: true, 
      message: '成果发布成功', 
      data: newAchievement 
    });
  } catch (error) {
    console.error('发布成果失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * PUT /achievements/:id
 * 更新成果信息
 */
server.put('/achievements/:id', verifyToken, (req, res) => {
  try {
    const id = Number(req.params.id);
    const achievement = router.db.get('achievements').find({ id }).value();
    
    if (!achievement) {
      return res.status(404).json({ 
        success: false, 
        message: '成果不存在' 
      });
    }
    
    // 更新信息
    router.db.get('achievements').find({ id }).assign(req.body).write();
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));
    
    res.json({ 
      success: true, 
      message: '成果信息更新成功' 
    });
  } catch (error) {
    console.error('更新成果失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * DELETE /achievements/:id
 * 删除成果
 */
server.delete('/achievements/:id', verifyToken, (req, res) => {
  try {
    const id = Number(req.params.id);
    const achievement = router.db.get('achievements').find({ id }).value();
    
    if (!achievement) {
      return res.status(404).json({ 
        success: false, 
        message: '成果不存在' 
      });
    }
    
    router.db.get('achievements').remove({ id }).write();
    fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));
    
    res.json({ 
      success: true, 
      message: '成果删除成功' 
    });
  } catch (error) {
    console.error('删除成果失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});
修改成通过type去筛选

    // 2. 找出该企业参与的所有会话
    const conversations = db.get('chatConversations')
      .filter({ enterpriseId: eid })
      .value()
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    // 3. 补充学生信息 + 消息列表
    const result = conversations.map(conv => {
      const student = db.get('users').find({ id: conv.studentId, role: 'student' }).value();

      // 🔽 查询该会话下的所有消息
      const messages = db.get('chatMessages')
        .filter({ conversationId: conv.id })
        .orderBy('timestamp', 'asc') // 按时间正序排列（从旧到新）
        .value();

      return {
        ...conv,
        student: student
          ? {
              id: student.id,
              name: student.name || '匿名学生',
              avatar: student.avatar || null,
              major: student.major || null,
              school: student.university || null
            }
          : {
              id: null,
              name: '已删除学生',
              avatar: null,
              major: null,
              school: null
            },
        messages: messages.map(msg => ({
          id: msg.id,
          senderType: msg.senderType,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('【服务器错误】查询企业会话及消息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
      error: error.message
    });
  }
});
// 🔹 2. 获取某个会话的消息记录
server.get('/api/chat/conversations/:id/messages', (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { studentId, enterpriseId } = req.query; // 也可以用 req.body（需配合中间件解析）

    const db = router.db;

    // 1. 校验参数是否齐全且为数字
    if (!conversationId || !studentId || !enterpriseId) {
      return res.status(400).json({
        success: false,
        message: '缺少 conversationId、studentId 或 enterpriseId'
      });
    }

    const sid = Number(studentId);
    const eid = Number(enterpriseId);

    if (isNaN(sid) || isNaN(eid)) {
      return res.status(400).json({
        success: false,
        message: 'studentId 和 enterpriseId 必须是有效的数字'
      });
    }

    // 2. 查找会话
    const conversation = db.get('chatConversations').find({ id: conversationId }).value();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    // 3. 显式校验：传入的 studentId 和 enterpriseId 是否与会话匹配
    if (conversation.studentId !== sid || conversation.enterpriseId !== eid) {
      return res.status(403).json({
        success: false,
        message: '提供的 studentId 或 enterpriseId 与会话不匹配'
      });
    }

    // 4. 查询该会话的所有消息（按时间升序）
    const messages = db.get('chatMessages')
      .filter({ conversationId })
      .orderBy('timestamp', 'asc')
      .value();

    // 5. 补充发送者姓名
    const enrichedMessages = messages.map(msg => {
      const sender = msg.senderType === 'student'
        ? db.get('students').find({ id: msg.senderId }).value()
        : db.get('enterprises').find({ id: msg.senderId }).value();

      return {
        ...msg,
        senderName: sender?.name || '未知用户'
      };
    });

    // 6. 返回成功
    res.json({
      success: true,
      data: enrichedMessages
    });

  } catch (error) {
    console.error('【服务器错误】获取消息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试'
    });
  }
});

// 🔹 3. 发送消息
// POST /api/chat/messages
server.post('/api/chat/messages', (req, res) => {
  try {
    const { studentId, enterpriseId, content, sender } = req.body;
    const db = router.db;

    // 1. 校验必要参数
    if (!studentId || !enterpriseId || !content || !sender) {
      return res.status(400).json({
        success: false,
        message: '缺少 studentId、enterpriseId、content 或 sender'
      });
    }

    if (!['student', 'enterprise'].includes(sender)) {
      return res.status(400).json({
        success: false,
        message: 'sender 必须是 "student" 或 "enterprise"'
      });
    }

    const sid = Number(studentId);
    const eid = Number(enterpriseId);

    if (isNaN(sid) || isNaN(eid)) {
      return res.status(400).json({
        success: false,
        message: 'studentId 和 enterpriseId 必须是数字'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 2. 检查用户是否存在
    const student = db.get('users').find({ id: sid, role: 'student' }).value();
    const enterprise = db.get('users').find({ id: eid, role: 'enterprise' }).value();

    if (!student || !enterprise) {
      return res.status(400).json({
        success: false,
        message: '学生或企业用户不存在'
      });
    }

    // 3. 自动生成 conversationId（顺序固定：conv_学生ID_企业ID）
    const conversationId = `conv_${sid}_${eid}`;

    // 4. 查找会话（是否已存在）
    let conversation = db.get('chatConversations').find({ id: conversationId }).value();

    if (!conversation) {
      // 创建新会话
      conversation = {
        id: conversationId,
        studentId: sid,
        enterpriseId: eid,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      db.get('chatConversations').push(conversation).write();
    }

    // 5. 判断发送者
    let senderType, senderId;

    if (sender === 'student') {
      senderType = 'student';
      senderId = sid;
    } else if (sender === 'enterprise') {
      senderType = 'enterprise';
      senderId = eid;
    }

    // 🔒 权限校验：确保当前 sender 确实是会话的一方
    if (
      (senderType === 'student' && senderId !== conversation.studentId) ||
      (senderType === 'enterprise' && senderId !== conversation.enterpriseId)
    ) {
      return res.status(403).json({
        success: false,
        message: '无权发送消息：身份与会话不匹配'
      });
    }

    // 6. 创建消息（显式包含 studentId 和 enterpriseId）
    const message = {
      id: generateChatId(),
      conversationId,
      studentId: sid,           // 👈 显式添加，方便前端使用
      enterpriseId: eid,        // 👈 显式添加
      senderType,
      senderId,
      content: content.trim(),
      type: 'text',
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    // 保存消息
    db.get('chatMessages').push(message).write();

    // 7. 更新会话信息
    // 规则：学生发消息 → 企业未读数 +1；企业发消息 → 未读数清零
    const finalUnreadCount = senderType === 'student'
      ? conversation.unreadCount + 1
      : 0;

    db.get('chatConversations')
      .find({ id: conversationId })
      .assign({
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
        unreadCount: finalUnreadCount
      })
      .write();

    // 8. 强制同步保存数据库文件（适用于 lowdb 文件存储）
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(db.getState(), null, 2));
    } catch (err) {
      console.error('持久化失败:', err);
      // 即使写文件失败，消息已写入内存，可降级返回
    }

    // 9. 返回成功响应
    res.status(201).json({
      success: true,
      data: message  // 包含 studentId, enterpriseId, senderId 等
    });

  } catch (error) {
    console.error('【服务器错误】发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '消息发送失败，请稍后重试',
      error: error.message
    });
  }
});
// 假设在你的 server 路由文件中添加如下代码
server.post('/api/chat/mark-as-read', (req, res) => {
  try {
    const { conversationId, studentId } = req.body;
    const db = router.db; // 假设 db 已正确挂载

    // 1. 校验必要参数
    if (!conversationId || !studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少 conversationId 或 studentId'
      });
    }

    const sid = Number(studentId);
    if (isNaN(sid)) {
      return res.status(400).json({
        success: false,
        message: 'studentId 必须是数字'
      });
    }

    // 2. 查找会话
    const conversation = db.get('chatConversations').find({ id: conversationId }).value();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    // 3. 权限校验：当前 studentId 是否是该会话的学生
    if (conversation.studentId !== sid) {
      return res.status(403).json({
        success: false,
        message: '无权操作：该会话不属于该学生'
      });
    }

    // 4. 更新未读数为 0
    db.get('chatConversations')
      .find({ id: conversationId })
      .assign({
        unreadCount: 0
      })
      .write();

    // 可选：持久化到文件（如果使用 lowdb 文件存储）
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(db.getState(), null, 2));
    } catch (err) {
      console.error('持久化失败:', err);
    }

    // 5. 返回成功
    res.status(200).json({
      success: true,
      message: '已标记为已读',
      data: {
        conversationId,
        unreadCount: 0
      }
    });

  } catch (error) {
    console.error('【服务器错误】标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
      error: error.message
    });
  }
});
// 🔹 4. 标记消息为已读
server.put('/api/chat/messages/read', (req, res) => {
  const { conversationId } = req.body;
  const db = router.db;

  if (!conversationId) {
    return res.status(400).json({ success: false, message: '缺少 conversationId' });
  }

  const userId = req.user.id;
  const user = db.get('users').find({ id: userId }).value();
  if (!user || user.role !== 'student') {
    return res.status(403).json({ success: false, message: '仅学生可标记已读' });
  }

  const conversation = db.get('chatConversations').find({ id: conversationId }).value();
  if (!conversation || conversation.studentId !== userId) {
    return res.status(403).json({ success: false, message: '无权操作此会话' });
  }

  // 将该会话中所有企业发送的消息标记为 read
  db.get('chatMessages')
    .filter(m => m.conversationId === conversationId && m.senderType === 'enterprise')
    .forEach(m => {
      m.status = 'read';
    })
    .write();

  // 清空未读数
  db.get('chatConversations')
    .find({ id: conversationId })
    .assign({ unreadCount: 0 })
    .write();

  fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

  res.json({ success: true, message: '消息已标记为已读' });
});

server.post('/api/chat/start', verifyToken, (req, res) => {
  const { enterpriseId, studentId, message } = req.body;
  const db = router.db;
  const userId = req.user.id;
  const user = db.get('users').find({ id: userId }).value();

  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
  if (!message) return res.status(400).json({ success: false, message: '消息内容不能为空' });

  let targetId, conversationId, isStudent;

  if (user.role === 'student') {
    if (!enterpriseId) return res.status(400).json({ success: false, message: '缺少企业ID' });
    isStudent = true;
    targetId = enterpriseId;
    conversationId = `conv_${userId}_${enterpriseId}`;
  } else if (user.role === 'enterprise') {
    if (!studentId) return res.status(400).json({ success: false, message: '缺少学生ID' });
    isStudent = false;
    targetId = studentId;
    conversationId = `conv_${studentId}_${userId}`;
  } else {
    return res.status(403).json({ success: false, message: '不支持的身份' });
  }

  // 检查会话是否存在
  let conversation = db.get('chatConversations').find({ id: conversationId }).value();

  if (!conversation) {
    conversation = {
      id: conversationId,
      studentId: isStudent ? userId : targetId,
      enterpriseId: isStudent ? targetId : userId,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: isStudent ? 0 : 1,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.get('chatConversations').push(conversation).write();
  }

  // 发送首条消息
  const msgId = (Date.now() % 1000000000).toString();
  const newMessage = {
    id: msgId,
    conversationId,
    senderType: user.role === 'student' ? 'student' : 'enterprise',
    senderId: userId,
    content: message.trim(),
    type: 'text',
    status: 'sent',
    timestamp: new Date().toISOString()
  };

  db.get('chatMessages').push(newMessage).write();

  // 更新会话
  db.get('chatConversations')
    .find({ id: conversationId })
    .assign({
      lastMessage: newMessage.content,
      lastMessageTime: newMessage.timestamp,
      unreadCount: isStudent ? 0 : (conversation.unreadCount || 0) + 1
    })
    .write();

  fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

  res.status(201).json({
    success: true,
    data: {
      conversationId,
      messageId: msgId
    }
  });
});
// DELETE /api/chat/messages/:id

server.delete('/api/chat/messages/:id', verifyToken, (req, res) => {
  const msgId = req.params.id;
  const db = router.db;
  const userId = req.user.id;

  const message = db.get('chatMessages').find({ id: msgId }).value();
  if (!message) return res.status(404).json({ success: false, message: '消息不存在' });

  if (message.senderId !== userId) {
    return res.status(403).json({ success: false, message: '不能撤回他人消息' });
  }

  const now = new Date();
  const sentTime = new Date(message.timestamp);
  if (now - sentTime > 2 * 60 * 1000) {
    return res.status(400).json({ success: false, message: '超过2分钟无法撤回' });
  }

  db.get('chatMessages').remove({ id: msgId }).write();
  db.get('chatConversations')
    .find({ id: message.conversationId })
    .assign({
      lastMessage: '(一条消息被撤回)',
      lastMessageTime: now.toISOString()
    })
    .write();

  fs.writeFileSync(dbFilePath, JSON.stringify(router.db.getState(), null, 2));

  res.json({ success: true, message: '消息已撤回' });
});

// 🔹 5. 获取未读消息总数
server.get('/api/chat/unread-count', (req, res) => {
  const db = router.db;
  const userId = req.user.id;
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  let totalCount = 0;
  let byEnterprise = [];

  if (user.role === 'student') {
    const conversations = db.get('chatConversations')
      .filter({ studentId: userId })
      .value();

    totalCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    byEnterprise = conversations
      .filter(c => c.unreadCount > 0)
      .map(c => {
        const ent = db.get('enterprises').find({ id: c.enterpriseId }).value();
        return {
          enterpriseId: c.enterpriseId,
          enterpriseName: ent?.name || '未知企业',
          count: c.unreadCount
        };
      });
  }

  res.json({ success: true, data: { totalCount, byEnterprise } });
});


// ✅ 接口2: 查询某个职位收到的所有求职申请
server.get('/job/:id/applications', (req, res) => {
  try {
    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的职位ID' 
      });
    }

    // ✅ 从数据库读取 applications
    const db = router.db;
    const applications = db.get('applications').value();
    const users = db.get('users').value(); // 用于获取学生姓名等信息

    // 过滤出该职位的申请
    const jobApplications = applications.filter(app => app.jobId === jobId);

    // 补充学生信息（姓名、电话等）
    const result = jobApplications.map(app => {
      const student = users.find(u => u.id === app.studentId);
      return {
        ...app,
        studentName: student?.name || '未知',
        studentPhone: student?.phone || '未知',
        studentEmail: student?.email || '未知'
      };
    });

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('💥 /job/:id/applications 错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 📂 企业查看收到的求职申请
server.get('/application/received', (req, res) => {
  try {
    const enterpriseId = Number(req.query.id);
    if (!enterpriseId) {
      return res.status(400).json({ success: false, message: '缺少企业 ID 参数' });
    }

    const db = router.db;

    // 企业的所有岗位ID
    const enterpriseJobs = db.get('jobs').filter(job => job.enterpriseId === enterpriseId).value();
    if (enterpriseJobs.length === 0) {
      return res.json({ success: true, data: {} });
    }
    const jobIds = enterpriseJobs.map(job => job.id);

    // 企业所有岗位的申请
    const applications = db.get('applications').filter(app => jobIds.includes(app.jobId)).value();
    if (applications.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // 所有学生
    const students = db.get('users').filter(user => user.role === 'student').value();

    // 按 jobId 分类的结果对象
    const categorized = {};

    for (const app of applications) {
      const student = students.find(s => s.id === app.studentId) || {};

      const jobIdKey = String(app.jobId);

      if (!categorized[jobIdKey]) {
        categorized[jobIdKey] = [];
      }

      categorized[jobIdKey].push({
        ...app,
        studentName: student.name || '',
        studentPhone: student.phone || '',
        studentEmail: student.email || '',
        studentResumeUrl: student.resumeUrl || '',
      });
    }

    res.json({ success: true, data: categorized });

  } catch (error) {
    console.error('获取收到的申请出错:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});



// 📄 查看求职意向详情 (企业端)
server.get('/application/detail', (req, res) => {
  const applicationId = Number(req.query.applicationId);
  const jobId = Number(req.query.jobId);

  if (!applicationId || !jobId) {
    return res.status(400).json({ success: false, message: '缺少 applicationId 或 jobId 参数' });
  }

  const db = router.db;

  // 找到对应的申请
  const application = db.get('applications')
    .find({ id: applicationId, jobId: jobId })
    .value();

  if (!application) {
    return res.status(404).json({ success: false, message: '申请不存在或不属于该岗位' });
  }

  // 找学生信息
  const student = db.get('students').find({ id: application.studentId }).value();

  if (!student) {
    return res.status(404).json({ success: false, message: '申请对应学生不存在' });
  }

  // 返回详细数据
  return res.json({
    success: true,
    data: {
      ...application,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      studentResumeUrl: student.resumeUrl || null,
    }
  });
});



// ✅ 更新求职意向状态
server.put('/application/:id/status', (req, res) => {
  const appId = Number(req.params.id);
  const { status } = req.body;

  const validStatuses = ['待处理', '已查看', '发起面试', '已录用', '已拒绝'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: '状态无效' });
  }

  const db = router.db;

  // 查找 application 表中的记录
  const application = db.get('applications')
    .find({ id: appId })
    .value();

  if (!application) {
    return res.status(404).json({ success: false, message: '申请记录不存在' });
  }

  // 更新 applications 表中的状态
  db.get('applications')
    .find({ id: appId })
    .assign({ status })
    .write();

  // 同步更新 users 表中对应学生的 application 状态（如果有）
  const students = db.get('users')
    .filter({ role: 'student' })
    .value();

  for (const student of students) {
    const apps = student.applications || [];
    const index = apps.findIndex(app => app.id === appId);
    if (index !== -1) {
      apps[index].status = status;
      db.get('users')
        .find({ id: student.id })
        .assign({ applications: apps })
        .write();
      break;
    }
  }

  res.json({ success: true, message: '状态更新成功' });
});


// ✅ 获取所有学生列表
server.get('/students', (req, res) => {
  const db = router.db;
  const students = db.get('students').value();

  res.json({ success: true, data: students });
});
 
server.get('/students/:id', (req, res) => {
  const db = router.db;
  const student = db.get('students').find({ id: Number(req.params.id) }).value();

  if (!student) {
    return res.status(404).json({ success: false, message: '学生不存在' });
  }

  res.json({ success: true, data: student });
});
// 获取单个资源详情
server.get('/resources/:id', (req, res) => {
  const id = Number(req.params.id)
  const resource = router.db.get('resources').find({ id }).value()

  if (!resource) {
    return res.status(404).json({ success: false, message: '资源不存在' })
  }

  res.json({ success: true, data: resource })
})
server.get('/careerPlan/majors', (req, res) => {
  const plans = router.db.get('careerPlans').value();
  const majors = plans.map(plan => plan.major);
  res.json({ success: true, data: majors });
});

server.get('/university/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const universities = router.db.get('universities').value();

  // 精确匹配学校名，忽略大小写
  const university = universities.find(u => u.name.toLowerCase() === name.toLowerCase());

  if (!university) {
    return res.status(404).json({ success: false, message: '学校不存在' });
  }

  res.json({ success: true, data: university });
});


// 删除课程
server.delete('/course/:id', (req, res) => {
  const id = Number(req.params.id)
  router.db.get('courses').remove({ id }).write()
  res.json({ success: true, message: '删除成功' })
})

// 获取企业需求列表
// 📌 获取企业列表（支持搜索 & 筛选）
server.get('/company/page', (req, res) => {
  const { keyword, location, position } = req.query

  let companies = router.db.get('enterpriseNeeds').value()

  // 🔍 关键词搜索（模糊匹配公司名、职位）
  if (keyword) {
    companies = companies.filter(c =>
      c.company.includes(keyword) ||
      c.position.includes(keyword) ||
      (c.requirement && c.requirement.includes(keyword))
    )
  }

  // 📍 按地点筛选
  if (location) {
    companies = companies.filter(c => c.location.includes(location))
  }

  // 💼 按职位筛选
  if (position) {
    companies = companies.filter(c => c.position.includes(position))
  }

  res.json({ success: true, data: companies })
})
server.get('/resources', (req, res) => {
  const resources = router.db.get('resources').value()
  res.json({ success: true, data: resources })
})


// 📝 获取单个资源详情
server.get('/resources/:id', (req, res) => { 
  const id = Number(req.params.id)
  const resource = router.db.get('resources').find({ id }).value()

  if (!resource) {
    return res.status(404).json({ success: false, message: '资源不存在' })
  }

  res.json({ success: true, data: resource })
})

server.get('/enterprise-need/:id', (req, res) => {
  try {
    const enterpriseId = Number(req.params.id); // 路径参数转换为数字

    if (!enterpriseId || isNaN(enterpriseId)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的 enterpriseId' 
      });
    }

    const db = router.db;

    // 获取企业招聘需求（根据 enterpriseId）
    const enterpriseNeed = db.get('enterpriseNeeds')
      .find({ enterpriseId })
      .value();

    if (!enterpriseNeed) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该企业的招聘需求' 
      });
    }

    // 查找 jobDetail，如果未附带，则尝试根据 position 和 enterpriseId 查找
    let jobDetail = enterpriseNeed.jobDetail;

    if (!jobDetail) {
      const job = db.get('jobs')
        .find({ 
          enterpriseId: enterpriseNeed.enterpriseId, 
          title: enterpriseNeed.position  // position 与 title 必须匹配
        })
        .value();

      if (job) {
        const enterprise = db.get('users')
          .find({ id: job.enterpriseId, role: 'enterprise' })
          .value();

        jobDetail = {
          id: job.id,
          enterpriseId: job.enterpriseId,
          title: job.title,
          description: job.description,
          requiredSkills: job.requiredSkills,
          salary: job.salary,
          location: job.location,
          company: enterprise?.name || null
        };
      }
    }

    const responseData = {
      ...enterpriseNeed,
      jobDetail
    };

    return res.json({ 
      success: true, 
      data: responseData 
    });

  } catch (error) {
    console.error('查询企业详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// ✅ 填写/更新个人信息接口
server.put('/user/update', (req, res) => {
  const { id, name, role, phone, password, education, major, age, university } = req.body

  // 1️⃣ 检查 id 是否传入
  if (!id) {
    return res.status(400).json({ success: false, message: '缺少用户ID' })
  }

  const users = router.db.get('users')
  const user = users.find({ id }).value()

  // 2️⃣ 检查用户是否存在
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  // 3️⃣ 更新用户信息（只更新有传入的字段）
  const updatedUser = {
    ...user,
    ...(name && { name }),
    ...(role && { role }),
    ...(phone && { phone }),
    ...(password && { password }),
    ...(education && { education }),
    ...(major && { major }),
    ...(age !== undefined && { age }),
    ...(university && { university })  // ✅ ✅ ✅ 这里加入大学字段
  }

  users.find({ id }).assign(updatedUser).write()

  return res.json({ success: true, message: '用户信息更新成功', user: updatedUser })
})


// 启用 json-server 默认路由
server.use(router)

server.listen(3000, () => {
  console.log('✅ JSON Server running at http://localhost:3000')
})
