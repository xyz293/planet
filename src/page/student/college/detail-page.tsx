import {useParams} from "react-router-dom";
import {resourse} from '../../../api/student/college'
import { useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom'
import './detail.scss'
interface Resource {
  id: number;
  title: string;
  avatar?: string;
  content: string;
  publishDate: string;
  author: string;
}

const DetailPage = () => {
    const params = useParams();
    const id = params.id;
    const [resourses, setResourse] = useState<Resource>();
      const navigate = useNavigate()
      const goback = ()=>{
        navigate(-1)
      }
    const showresourse = async()=>{
        const res = await resourse(Number(id))
        console.log(res)
        setResourse(res.data.data)
    }
    useEffect(()=>{
        showresourse()
    },[])
  return (
   <div className="detail-page">
    <h1 className="detail-title">{resourses?.title}</h1>
    <div className="detail-meta">
      <span>发布时间：{resourses?.publishDate}</span>
      <span>作者：{resourses?.author}</span>
    </div>
    <div className="detail-content">{resourses?.content}</div>
    <button className="btn-back" onClick={goback}>返回</button>
  </div>
  );
};
export default DetailPage;