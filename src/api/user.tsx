import request from '../ulits/request'
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