import request from '../../ulits/request'
export const getresourse =()=>{
    return request.get('/resources')
}
export const getmyclass =(university:string)=>{
    return request.get('/course/search',{
        params:{
            university
        }
    })
}
export const getuniversity =()=>{
    return request.get('/university/list')
}
export const getcollegedetail =(key:string)=>{ 
    return request.get(`/university/${key}`,{
    })
}
export  const getgudice =(key?:string)=>{
    return request.get('/careerPlan/search',{  params:{
           major: key
        }

    })
}
export const getmajor =(key?:string)=>{
    return request.get('/careerPlan/majors',{
        params:{
           major: key
        }
    })
}
export const resourse =(id:number)=>{

    return request.get(`/resources/${id}`,{
    })
}
export const  getviews =(id:number)=>{
    return request.post(`/job/${id}/view`)
}
