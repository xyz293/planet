import { useParams } from 'react-router-dom';
import { detailstudnet,updateapply } from '../../../api/company/leader';
import { useEffect, useState } from 'react';

interface Student {
  id: number;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  education: string;
  university: string;
  major: string;
  skills: string[];
  experience: string;
  resumeUrl: string;
  expectedJob: string;
  expectedSalary: string;
  location: string;
  portfolioUrl: string;
  selfIntro: string;
  status: string;
  createTime: string; // ISO 时间字符串
}

const StudentJobDetail = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const showStudent = async () => {
    try {
      const res = await detailstudnet(id);
      setStudent(res.data.data);
    } catch (error) {
      console.error('获取学生详情失败', error);
    }
  };
  const firstenter = async () => {
   const res = await updateapply(id,'已查看')
   console.log(res)

  }


  useEffect(() => {
    if (!isNaN(id)) {
      showStudent();
    }
    firstenter()

  }, []);

  if (!student) {
    return (
      <div style={{ padding: 24, fontSize: 16, color: '#666', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: 8,
        backgroundColor: '#fff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          borderBottom: '2px solid #1890ff',
          paddingBottom: 8,
          marginBottom: 24,
          color: '#1890ff',
          fontWeight: '700',
          fontSize: 28,
        }}
      >
        学生详情
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <DetailItem label="姓名" value={student.name} />
        <DetailItem label="手机号" value={student.phone} />
        <DetailItem label="邮箱" value={student.email} />
        <DetailItem label="年龄" value={student.age.toString()} />
        <DetailItem label="性别" value={student.gender} />
        <DetailItem label="学历" value={student.education} />
        <DetailItem label="大学" value={student.university} />
        <DetailItem label="专业" value={student.major} />
        <DetailItem label="技能" value={student.skills.join(', ')} />
        <DetailItem label="工作经历" value={student.experience} />
        <DetailItem label="期望职位" value={student.expectedJob} />
        <DetailItem label="期望薪资" value={student.expectedSalary} />
        <DetailItem label="工作地点" value={student.location} />
        <DetailItem label="个人介绍" value={student.selfIntro} />
        <DetailItem label="状态" value={student.status} />
        <DetailItem label="创建时间" value={new Date(student.createTime).toLocaleString()} />
      </div>

      <div
        style={{
          marginTop: 32,
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <button
          onClick={async () => {
            const res = await updateapply(id, '发起面试');

            console.log(res);
          }}

          style={{
            backgroundColor: '#1890ff',
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            fontSize: 16,
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#40a9ff')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1890ff')}
        >
          发起面试
        </button>
        <button
          onClick={async () => {
            const res = await updateapply(id, '已拒绝');

            console.log(res);
          }}

          style={{
            backgroundColor: '#f5222d',
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            fontSize: 16,
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff4d4f')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5222d')}
        >
          拒绝面试
        </button>
      </div>
    </div>
  );
};

interface DetailItemProps {
  label: string;
  value: string;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
    }}
  >
    <div style={{ fontWeight: 600, color: '#333' }}>{label}：</div>
    <div
      style={{
        color: '#555',
        maxWidth: '70%',
        textAlign: 'right',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {value}
    </div>
  </div>
);

export default StudentJobDetail;
