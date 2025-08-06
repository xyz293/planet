import request from '../../ulits/request'
export const getstudent = () =>{
  return request.get('/students')
}
export const getstudentdetail = (id: number) => {
  return request.get(`/students/${id}`)
}
