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
  const { id: companyIdStr, jobid: jobIdStr } = useParams<{ id?: string; jobid?: string }>();

  const companyId = Number(companyIdStr);
  const jobId = Number(jobIdStr);

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getjob =async()=>{
    const res = await sendapply(1001,jobId)
    console.log(res)

  }


  // 获取公司详情
  const fetchCompanyDetail = async () => {
    if (isNaN(companyId)) return;

    try {
      const res = await getcompanydetail(companyId);
      if (res.data?.data) {
        setCompany(res.data.data);
      } else {
        console.warn('公司数据未返回', res);
      }
    } catch (err) {
      console.error('获取公司详情失败:', err);
    }
  };

  // 获取职位详情
  const fetchJobDetail = async () => {
    if (isNaN(jobId)) return;

    try {
      const res = await getjobdetail(companyId);
      if (res.data?.responseData?.jobDetail) {
        setJob(res.data.responseData.jobDetail);
      } else {
        console.warn('职位数据结构异常', res.data);
      }
    } catch (err) {
      console.error('获取职位详情失败:', err);
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError(null);

      // 并行加载，更快
      await Promise.all([
        fetchCompanyDetail(),
        fetchJobDetail(),
      ]);

      setLoading(false);
    };

    loadDetails();
  }, [companyId, jobId]);

  if (loading) {
    return <div className="detail-company loading">📌 正在加载详情...</div>;
  }

  if (error) {
    return <div className="detail-company error">❌ {error}</div>;
  }

  return (
    <div className="detail-company">
      {/* 公司信息 */}
      {company && (
        <section className="company-section">
          <h2 className="company-name">{company.company}</h2>
          <ul className="company-info">
            <li><strong>招聘职位：</strong>{company.position}</li>
            <li><strong>工作地点：</strong>{company.location}</li>
            <li><strong>岗位要求：</strong>{company.requirement}</li>
            <li><strong>薪资待遇：</strong>{company.salary}</li>
          </ul>
        </section>
      )}

      {/* 职位详情 */}
      {job && (
        <section className="job-section">
          <h2 className="job-title">{job.title}</h2>
          <div className="job-description">
            <p>{job.description}</p>
          </div>
          <ul className="job-meta">
            <li><strong>企业 ID：</strong>{job.enterpriseId}</li>
            <li>
              <strong>技能要求：</strong>
              {job.requiredSkills.length > 0 
                ? job.requiredSkills.join('、') 
                : '无特殊要求'}
            </li>
            <li><strong>薪资范围：</strong>{job.salary}</li>
            <li><strong>工作城市：</strong>{job.location}</li>
          </ul>
        </section>
      )}

      {/* 数据为空时的兜底提示 */}
      {!company && !job && (
        <p className="no-data">暂无相关信息</p>
      )}
      <div>
        <button  onClick={getjob} >

            申请岗位
        </button>
      </div>
    </div>
  );
};

export default DetailCompany;