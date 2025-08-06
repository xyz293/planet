import { getapply } from '../../../api/company/leader'
import { useEffect, useState } from 'react'
import { useNavigate ,Link} from 'react-router-dom'
import {getcompanyjob} from '../../../api/company/leader'
//获取job详情

interface ReceivedApplication {
  status: string;
  id:number;
  jobId:number;

  studentEmail: string;
  studentId: number;
  studentName: string;
  studentPhone: string;
  studentResumeUrl: string;
  timestamp: string;
}

const JobSeekerList = () => {
  const [candidates, setCandidates] = useState<ReceivedApplication[]>([])
  const navigate = useNavigate()

  const fetchCandidates = async () => {
    const res = await getapply(5002)
    setCandidates(res.data.data)
    console.log(res)

  }
  const fetchJob = async (id: number) => {
    const res = await getcompanyjob(id)
    console.log(res)
  }


  useEffect(() => {
    fetchJob(5003)

  }, [])
 


  const getdetail = (id: number,companyId:number) => {
    navigate('/studentdetail/' + id+'/'+companyId)
  }

  return (
   <div>

   </div>
  )
}

export default JobSeekerList
