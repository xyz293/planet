import { useParams } from 'react-router-dom';
import { getcompanydetail, getjobdetail } from '../../../api/student/company';
import {sendapply} from '../../../api/student/user'
import { useEffect, useState } from 'react';
import './detail.scss';

// 职位类型
interface Job {
  id: number;
  enterpriseId: number;
  title: string;
  description: string;
  requiredSkills: string[];
  salary: string;
  location: string;
}

// 公司详情类型
interface CompanyDetail {
  company: string;
  id?: number;
  location: string;
  position: string;
  requirement: string;
  salary: string;
}

const DetailCompany = () => {

  const {id} = useParams()
  const getjob = async () => {
    const res = await getjobdetail(Number(id))
    console.log(res)

  }
  useEffect(() => {

    getjob()
  }, [])
  return (
    <div>
      <div>
        <h1>公司详情</h1>
      </div>
    </div>
  )



};

export default DetailCompany;