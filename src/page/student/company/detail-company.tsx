import { useParams } from 'react-router-dom';
import { getjobdetail } from '../../../api/student/company';
import {sendapply} from '../../../api/student/user'
import { useEffect, useState } from 'react';
import './detail.scss';
import {getviews} from '../../../api/student/college'
import {sendmessage} from '../../../api/student/user'

// 职位类型
interface JobDetail {
  jobId: number;
  title: string;
  department: string;
  location: string;
  workType: string;
  salary: string;
  status: string;
  postedAt: string;
  validUntil: string;
  enterpriseId: number;
  education: string;
  experience: string;
  reportTo: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  recruitmentProcess: string[];
  benefits: string[];
  contact: {
    recruiterName: string;
    email: string;
  };
  applications: number;
  views: number;

}

const DetailCompany = () => {
  const showviews = async (id: number) => {
    const res = await getviews(id);
    console.log(res);
  }

  const [job, setJob] = useState<JobDetail[]>([]);
  const { id } = useParams();

  const getjob = async () => {
    const res = await getjobdetail(Number(id));
    setJob(res.data.responseData.jobDetails);
    console.log(res);
  };
  const sendapplyjob = async (id: number) => {
    const res = await sendapply(1001,id );
    console.log(res);
  };
   const sendmessages = async (contest:string,enterpriseId
:number) => {

    const res = await sendmessage(1001,enterpriseId,contest,'student')
    console.log(res);
  }


  useEffect(() => {
    getjob();
  }, []);

  return (
    <div className="job-detail-container">
      <h1 className="main-title">职位详情</h1>

     {job.map(item => (
  <div className="job-card" key={item.jobId} onMouseEnter={()=>{showviews(item.jobId)
    console.log(item.jobId)

  }}>

    {/* 始终显示的 header */}
    <div className="job-header">
      <div className="job-info">
        <h2>{item.title}</h2>
        <div className="tag-list">
          <span className="tag">{item.department}</span>
          <span className="tag">{item.location}</span>
          <span className="tag">{item.workType}</span>
          <span className="tag tag-salary">{item.salary}</span>
        </div>
      </div>
      <div className="job-stats">
        <span className="status">{item.status}</span>
        <span className="views">👁 {item.views} 浏览</span>
        <span className="applications">📄 {item.applications} 申请</span>
      </div>
    </div>

    {/* 👇 鼠标悬停才显示的内容部分 👇 */}
    <div className="job-card-content">
      <div className="meta-block">
        <p><strong>发布时间：</strong>{item.postedAt} &nbsp;|&nbsp; <strong>截止：</strong>{item.validUntil}</p>
        <p><strong>学历要求：</strong>{item.education} &nbsp;|&nbsp; <strong>经验：</strong>{item.experience}</p>
        <p><strong>汇报对象：</strong>{item.reportTo}</p>
      </div>

      <div className="job-section">
        <h3>职位简介</h3>
        <p>{item.description}</p>
      </div>

      <div className="job-section">
        <h3>岗位职责</h3>
        <ul>{item.responsibilities.map((res, i) => <li key={i}>{res}</li>)}</ul>
      </div>

      <div className="job-section">
        <h3>任职要求</h3>
        <ul>{item.requirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
      </div>

      <div className="job-section">
        <h3>技能要求</h3>
        <p><strong>必备：</strong>{item.requiredSkills.join('、')}</p>
        <p><strong>加分：</strong>{item.preferredSkills.join('、')}</p>
      </div>

      <div className="job-section">
        <h3>招聘流程</h3>
        <p>{item.recruitmentProcess.join(' → ')}</p>
      </div>

      <div className="job-section">
        <h3>福利待遇</h3>
        <p>{item.benefits.join('、')}</p>
      </div>

      <div className="job-section contact">
        <h3>联系方式</h3>
        <p>联系人：{item.contact.recruiterName}</p>
        <p>邮箱：{item.contact.email}</p>
      </div>

      <div className="job-section">
        <h3>申请</h3>
        <button onClick={() => {sendapplyjob(item.jobId)
          sendmessages('你好,我想申请该岗位',item.enterpriseId)

        }}>申请</button>
      </div>
    </div>
  </div>
))}

    </div>
  );
};

export default DetailCompany;
