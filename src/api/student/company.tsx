import request from '../../ulits/request';
interface company {
 keyword?:string,
}
export const getcompany1 = (params:company) => {
  return request.get(
    '/company/page',
    {
      params
}

  )
}
export const getcompany = () => {
  return request.get(
    '/company/page',
  )
}
export const getcompanydetail = (id:number) => {
  return request.get(`/company/${id}`
  )
}
export const getjobdetail = (id:number) => {
  return request.get(`/enterprise-need/${id}`
  )
}
