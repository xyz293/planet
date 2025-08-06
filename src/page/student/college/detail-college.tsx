import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getcollegedetail, getmyclass } from '../../../api/student/college';

interface College {
  id: number;
  name: string;
  description: string;
  location: string;
  type: string;
  website: string;
}

interface MyClass {
  id: number;
  department: string;
  teacher: string;
  time: string;
  description: string;
  university: string;
}

const DetailCollege = () => {
  const [college, setCollege] = useState<College>();
  const [myclass, setMyclass] = useState<MyClass[]>([]);
  const params = useParams();
  const name = params.name as string;

  const showcollege = async () => {
    const res = await getcollegedetail(name);
    const res1 = await getmyclass(name);
    setCollege(res.data.data);
    setMyclass(res1.data.data);
  };

  useEffect(() => {
    showcollege();
  }, []);

  return (
    <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif' }}>
      {/* 学院详情 */}
      <div style={{
        background: '#f9f9f9',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ marginBottom: '12px', fontSize: '28px', color: '#333' }}>{college?.name}</h2>
        <p style={{ fontSize: '16px', color: '#555' }}>{college?.description}</p>
        <p><strong>📍 位置：</strong>{college?.location}</p>
        <p><strong>🏫 类型：</strong>{college?.type}</p>
        <p><strong>🔗 官网：</strong><a href={college?.website} target="_blank" rel="noreferrer">{college?.website}</a></p>
      </div>

      {/* 课程列表 */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '24px', color: '#444' }}>📚 开设课程</h3>
        {myclass.length === 0 ? (
          <p style={{ color: '#888' }}>暂无课程信息。</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {myclass.map((item) => (
              <div key={item.id} style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}>
                <h4 style={{ margin: '0 0 8px', color: '#333' }}>{item.department}</h4>
                <p><strong>👨‍🏫 教师：</strong>{item.teacher}</p>
                <p><strong>🕒 时间：</strong>{item.time}</p>
                <p style={{ color: '#555' }}>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailCollege;
