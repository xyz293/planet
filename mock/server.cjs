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
  try {
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

    return res.json({ success: true, user })
  } catch (error) {
    console.error('获取用户信息失败：', error)
    return res.status(500).json({ success: false, message: '服务器内部错误' })
  }
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

// 📌 获取单个企业详情
server.get('/company/:id', (req, res) => {
  const id = Number(req.params.id)
  const company = router.db.get('enterpriseNeeds').find({ id }).value()

  if (!company) {
    return res.status(404).json({ success: false, message: '企业不存在' })
  }

  res.json({ success: true, data: company })
})

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
