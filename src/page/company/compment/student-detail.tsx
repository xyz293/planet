import { getstudentdetail } from '../../../api/company/student';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {updateapply,sendmessage} from  '../../../api/company/leader'

interface StudentResumeDetail {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  location: string;
  university: string;
  major: string;
  education: string;
  status: string;
  expectedJob: string;
  expectedSalary: string;
  experience: string;
  selfIntro: string;
  skills: string[];
  portfolioUrl: string;
  resumeUrl: string;
  createTime: string;
}

const StudentDetail = () => {
  const [student, setStudent] = useState<StudentResumeDetail>();
  const params = useParams();
  const studentid = Number(params.studentid);
  const id = Number(params.id)
  const updateapplys = async (id:number,status:string) => {
    const res = await updateapply(id,status)
     console.log(res);
  }
  const sendmessages = async (contest:string) => {
    const res = await sendmessage(studentid,5003,contest,'enterprise')
    console.log(res);
  }


 const show = async () => {
      const res = await getstudentdetail(studentid);
      console.log(res);
      setStudent(res.data.data);
    };
  useEffect(() => {
      show();
  
    if(student?.status==='待处理'){
           updateapplys(id,'已查看')
    }
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>🎓 学生详情</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '20px', backgroundColor: '#f9f9f9' }}>
        <div style={{ marginBottom: '16px' }}>
          <strong>姓名：</strong>{student?.name} &nbsp;&nbsp;
          <strong>年龄：</strong>{student?.age} &nbsp;&nbsp;
          <strong>性别：</strong>{student?.gender}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>电话：</strong>{student?.phone} <br />
          <strong>邮箱：</strong>{student?.email}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>所在城市：</strong>{student?.location} <br />
          <strong>毕业院校：</strong>{student?.university} <br />
          <strong>专业：</strong>{student?.major} <br />
          <strong>学历：</strong>{student?.education}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>当前状态：</strong>{student?.status} <br />
          <strong>期望职位：</strong>{student?.expectedJob} <br />
          <strong>期望薪资：</strong>{student?.expectedSalary}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>实习/工作经验：</strong>
          <p style={{ margin: '4px 0' }}>{student?.experience}</p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>自我介绍：</strong>
          <p style={{ margin: '4px 0' }}>{student?.selfIntro}</p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>技能：</strong>{student?.skills.join(', ')}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>作品集：</strong>
          <a href={student?.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
            点击查看
          </a>
          <br />
          <strong>简历文件：</strong>
          <a href={student?.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
            点击下载
          </a>
        </div>

        <div style={{ marginBottom: '8px', color: '#888' }}>
          <small>创建时间：{new Date(student?.createTime || '').toLocaleString()}</small>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button
          onClick={()=>{updateapplys(id,'发起面试')
            sendmessages('你最近有时间来参加我们这的面试吗')
          }

          }
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          联系学生
        </button>
        <button
          onClick={()=>
           { updateapplys(id,'已拒绝')
               sendmessages('不好意思，你不符合我们的要求')
           }}

          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          拒绝学生
        </button>
      </div>
    </div>
  );
};

export default StudentDetail;
