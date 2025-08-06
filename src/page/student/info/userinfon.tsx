import { getstudentdetail } from '../../../api/company/student'
import { useEffect, useState } from 'react'

interface StudentResume {
  name: string
  phone: string
  email: string
  age?: number
  gender?: '男' | '女' | '其他'
  education?: string
  university?: string
  major?: string
  skills?: string[]
  experience?: string
  resumeUrl?: string
  expectedJob?: string
  expectedSalary?: string
  location?: string
  portfolioUrl?: string
  selfIntro?: string
  status?: string
}

const StudentJobDetail = () => {
  const id = 1001
  const [detail, setDetail] = useState<StudentResume>()

  const fetchDetail = async (id: number) => {
    const res = await getstudentdetail(id)
    setDetail(res.data.data)
  }

  useEffect(() => {
    if (id) {
      fetchDetail(Number(id))
    }
  }, [id])

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '20px auto',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#333',
        lineHeight: '1.5'
      }}
    >
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '16px',
          textAlign: 'center',
          color: '#2563eb'
        }}
      >
        学生详细信息
      </h2>

      {/* 基本信息 - 行内两列 */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>基础信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 10px' }}>
          <div><strong>姓名：</strong>{detail?.name || '未填写'}</div>
          <div><strong>年龄：</strong>{detail?.age ?? '未填写'}</div>
          <div><strong>手机：</strong>{detail?.phone || '未填写'}</div>
          <div><strong>性别：</strong>{detail?.gender || '未填写'}</div>
          <div><strong>邮箱：</strong>{detail?.email || '未填写'}</div>
          <div><strong>学历：</strong>{detail?.education || '未填写'}</div>
          <div><strong>院校：</strong>{detail?.university || '未填写'}</div>
          <div><strong>专业：</strong>{detail?.major || '未填写'}</div>
        </div>
      </div>

      {/* 求职意向 - 紧凑行内 */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>求职意向</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 10px' }}>
          <div><strong>期望岗位：</strong>{detail?.expectedJob || '未填写'}</div>
          <div><strong>期望薪资：</strong>{detail?.expectedSalary || '未填写'}</div>
          <div><strong>工作地点：</strong>{detail?.location || '未填写'}</div>
          <div><strong>当前状态：</strong>{detail?.status || '找工作中'}</div>
        </div>
      </div>

      {/* 附加信息 - 紧凑列表 */}
      <div style={{ fontSize: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>附加信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          <p style={{ margin: 0 }}>
            <strong>技能：</strong>
            {detail?.skills?.length ? detail.skills.join(', ') : '未填写'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>经历：</strong>
            {detail?.experience || '未填写'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>作品集：</strong>
            {detail?.portfolioUrl ? (
              <a href={detail.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '14px' }}>
                查看作品集
              </a>
            ) : (
              '未提供'
            )}
          </p>
          <p style={{ margin: 0 }}>
            <strong>简历：</strong>
            {detail?.resumeUrl ? (
              <a href={detail.resumeUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '14px' }}>
                下载简历
              </a>
            ) : (
              '未上传'
            )}
          </p>
          <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-line' }}>
            <strong>自我介绍：</strong>
            {detail?.selfIntro ? detail.selfIntro.slice(0, 100) + (detail.selfIntro.length > 100 ? '...' : '') : '未填写'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StudentJobDetail