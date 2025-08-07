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
export const getcompanydetail = (enterpriseId:number) => {
  return request.get('/enterprise-need/:enterpriseId',
    {
      params:{
        enterpriseId
      }
    }

  )
}
export const getjobdetail = (id:number) => {
  return request.get(`/enterprise-need/${id}`
  )
}
