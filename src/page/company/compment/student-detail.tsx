import {getstudentdetail} from '../../../api/company/student'
import { useParams } from 'react-router-dom'
import {useEffect, useState} from 'react'
interface StudentResumeDetail {
  id: number;                     // 学生ID
  name: string;                  // 姓名
  age: number;                   // 年龄
  gender: string;                // 性别
  phone: string;                 // 电话
  email: string;                 // 邮箱
  location: string;              // 所在城市
  university: string;            // 毕业院校
  major: string;                 // 专业
  education: string;             // 学历
  status: string;                // 当前状态（如“找工作中”）
  expectedJob: string;           // 期望职位
  expectedSalary: string;        // 期望薪资
  experience: string;            // 实习或工作经验
  selfIntro: string;             // 自我介绍
  skills: string[];              // 技能列表
  portfolioUrl: string;          // 作品集链接
  resumeUrl: string;             // 简历文件链接
  createTime: string;            // 创建时间（ISO 字符串）
}

const StudentDetail = () => {
    const [student,setStudent] = useState<StudentResumeDetail>()

    const params = useParams()
    const id = Number(params.id)

    const show = async ()=>{
        const res = await getstudentdetail(id)
        console.log(res)
        setStudent(res.data.data)
    }
    useEffect(()=>{
        show()
    },[])

   return (
    <div>
    <div>
          <h1>学生详情</h1>
    <p>姓名：{student?.name}</p>
    <p>年龄：{student?.age}</p>
    <p>性别：{student?.gender}</p>
    <p>电话：{student?.phone}</p>
    <p>邮箱：{student?.email}</p>
    <p>所在城市：{student?.location}</p>
    <p>毕业院校：{student?.university}</p>
    <p>专业：{student?.major}</p>
    <p>学历：{student?.education}</p>
    <p>当前状态：{student?.status}</p>
    <p>期望职位：{student?.expectedJob}</p>
    <p>期望薪资：{student?.expectedSalary}</p>
    <p>实习或工作经验：{student?.experience}</p>
    <p>自我介绍：{student?.selfIntro}</p>
    <p>技能：{student?.skills.join(', ')}</p>
    <p>作品集链接：{student?.portfolioUrl}</p>
    <p>简历文件链接：{student?.resumeUrl}</p>
    <p>创建时间：{student?.createTime}</p>
    </div>
    <div>
    <button>联系学生</button>
      <button>拒绝学生</button>
    </div>
    </div>
   )
}
export default StudentDetail
