import { getresourse } from '../../../api/student/college';
import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import './resourse.scss';

interface Resource {
  id: number;
  title: string;
  avatar?: string;
  content: string;
  publishDate: string;
  author: string;
}

const Resourse = () => {
  const [resources, setResources] = useState<Resource[]>([]);

  const showresourse = async () => {
    const res = await getresourse();
    console.log(res);
    setResources(res.data.data);
  };
   const navigate=useNavigate()
   const getdetail=(id:number)=>{
    navigate(`/resourse/${id}`)
    
   }
  useEffect(() => {
    showresourse();
  }, []);

  return (
    <div className="resourse-page">
      <h1 className="resourse-title">就业指导</h1>
      <div className="resourse-container">
        {resources.length > 0 ? (
          resources.map(item => (
            <div className="resourse-item" key={item.id} onClick={()=>getdetail(item.id)} >
              {item.avatar && (
                <img
                  className="resourse-avatar"
                  src={item.avatar}
                  alt={item.title}
                  loading="lazy"
                />
              )}
              <div className="resourse-content">
                <h2 className="resourse-item-title">{item.title}</h2>
                <p className="resourse-item-text">{item.content}</p>
                <div className="resourse-item-footer">
                  <span>发布时间：{item.publishDate}</span>
                  <span>作者：{item.author}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">暂无就业指导</p>
        )}
      </div>
    </div>
  );
};

export default Resourse;
