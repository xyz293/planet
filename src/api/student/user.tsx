import request from '../../ulits/request'
// 注册
interface updateUserInfoParams {
  id: number;
  name: string;
  role?: string;
  education: string;
  major: string;
  age: number;
  university:string
}
interface StudentResume {
  name: string;                // 学生姓名，必填
  phone: string;               // 手机号码，必填
  email: string;               // 邮箱，必填
  age?: number;                // 年龄，选填
  gender?: '男' | '女' | '其他'; // 性别，选填
  education?: string;          // 学历（本科、硕士、博士等），选填
  university?: string;         // 毕业院校，选填
  major?: string;              // 专业，选填
  skills?: string[];           // 技能列表，选填
  experience?: string;         // 实习或项目经历，选填
  resumeUrl?: string;          // 简历文件URL，选填
  expectedJob?: string;        // 期望岗位，选填
  expectedSalary?: string;     // 期望薪资，选填
  location?: string;           // 期望工作地点，选填
  portfolioUrl?: string;       // 作品集链接，选填
  selfIntro?: string;          // 自我介绍，选填
  status?: string;             // 求职状态，选填，默认“找工作中”
}

export const sendcode = (phone:string) => {
  return request.get(
    '/user/sendCode',
    {
       params: {
         phone,
       }
    }
  )
}
export const register = (phone:string,code:string,password:string) => {
  return request.post(
  '/user/regist',
    {
            phone,
            code,
            password
    }
    
  )
}
export const login = (phone:string,password:string) => {
  return request.post(
  '/user/login',
    {
     phone,
    password
    }
    
  )
}
export const getUserInfo = (id: number) => {
  if (!id || isNaN(id)) {
    return Promise.reject(new Error('无效的用户ID'))
  }
  return request.get('/user/info', {
    params: { id }
  })
}
export const updateUserInfo = (data:updateUserInfoParams) => {
  return request.put('/user/update', data)
}
export const createdata =(data:StudentResume)=>{
  return request.post('/students',data)
}
export const selectcredits =(id:number,role:string)=>{
     return request.post('/user/setRole',{
       
        id,
        role
      
     })
}
export const sendapply = (id: number, jobid: number) => {
    return request.post('/application/submit',{
      studentId: id,       
      jobId: jobid        
    })

};
export const myapply =  (id:number) => {

  return request({
    url: '/application/my',
    method: 'get',
    params: {
      id
    }

  })
}
