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

// 获取用户信息接口
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
  const { id, phone, name, age, education, major, university, role } = user
  res.json({
    success: true,
    data: { id, phone, name, age, education, major, university, role }
  })
})


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

    // 1️⃣ 从所有企业的 jobDetails 中查找该岗位
    const enterpriseNeeds = db.get('enterpriseNeeds').value();
    let targetJob = null;
    let targetCompany = null;

    for (const company of enterpriseNeeds) {
      if (Array.isArray(company.jobDetails)) {
        targetJob = company.jobDetails.find(j => j.id === jobId);
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

    // 2️⃣ 如果没有 views 字段，初始化为 0
    if (typeof targetJob.views === 'undefined') {
      targetJob.views = 0;
    }

    // 3️⃣ 浏览量 +1
    targetJob.views += 1;

    // 4️⃣ 找到该岗位在数组中的索引并更新
    const jobIndex = targetCompany.jobDetails.findIndex(j => j.id === jobId);
    targetCompany.jobDetails[jobIndex] = targetJob;

    // 5️⃣ 更新企业数据
    db.get('enterpriseNeeds')
      .find({ id: targetCompany.id })
      .assign(targetCompany)
      .write();

    // 6️⃣ 返回最新浏览量
    return res.json({
      success: true,
      message: '浏览量已增加',
      data: {
        jobId: targetJob.id,
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
