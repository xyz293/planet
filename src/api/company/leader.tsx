import request from '../../ulits/request'
export const getapply = async (id:number) => {

  return request({
    url:'/application/received',
    method: 'get',
    params:{
      id
    }

  })
}
// 修改applydetail函数，传入applicationId和enterpriseId
export const applydetail = async (applicationId: number, jobId: number) => {
  return request({
    url: `/application/detail`,
    method: 'get',
    params: {
      applicationId,
      jobId,
    },
  });
};
export const detailstudnet = async (id: number) => {
  return request({
    url: `/students/${id}`,
    method: 'get',
  });
}
export const updateapply = async (id: number, status: string) => {
  return request({
    url: `/application/${id}/status`,
    method: 'put',
    data: {
      status,
    }

  });
}
export const getjob = async (id: number) => {
  return request({
    url: '`/job/${id}`',
    method: 'get',
  });
}
export const getcompanyjob = async (id: number) => {
  return request({
    url: '/jobs',  // 动态拼接路径参数
    method: 'get',
    params:{
    enterpriseId: id 
    }
  });
}
export const getjobdetail = async (id: number) => {
  return request({
    url: `/job/${id}`,
    method: 'get',
  });
}
export const jobs = async (id: number) => {
  return request({
    url: `/job/${id}/applications`,
    method: 'get',
  });
}




