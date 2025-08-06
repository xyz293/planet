import { getuniversity,getcollegedetail } from '../../../api/student/college';
import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';

interface College {
  id: number;
  name: string;
  description: string;
  location: string;
  type: string;
  website: string;
}

const CollegeList = () => {
  const [collegeList, setCollegeList] = useState<College[]>([]);
  const navigate = useNavigate();
  const getdetails =(key:string)=>{ 
    navigate(`/college/${key}`);
  }

  const fetchColleges = async () => {
    try {
      const res = await getuniversity();
   
        setCollegeList(res.data.data);
    } catch (error) {
      console.error('请求出错:', error);
    }
  };


  useEffect(() => {
    fetchColleges();
  }, []);

  return (
    <section style={{ maxWidth: 800, margin: '20px auto', padding: '0 16px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#333' }}>高校列表</h2>
      <ul  style={{ listStyle: 'none', padding: 0 }} >
        {collegeList.map((college) => (
          <li
          onClick={() => getdetails(college.name)}
            key={college.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              backgroundColor: '#fafafa',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#0057e7' }}>{college.name}</h3>
            <p style={{ margin: '4px 0', fontStyle: 'italic', color: '#555' }}>{college.description}</p>
            <p style={{ margin: '4px 0', color: '#777' }}>
              <strong>位置：</strong>
              {college.location}
            </p>
            <p style={{ margin: '4px 0', color: '#777' }}>
              <strong>类型：</strong>
              {college.type}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>官网：</strong>
              <a href={college.website} target="_blank" rel="noopener noreferrer" style={{ color: '#007acc' }}>
                {college.website}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CollegeList;
