import { getmyclass } from '../../../api/student/college';
import { useState, useEffect } from 'react';

interface MyClass {
  id: number;
  department: string;
  teacher: string;
  time: string;
  description: string;
  university: string;
}

const Myclass = () => {
  const [myclass, setMyclass] = useState<MyClass[]>([]);

  const getMyclassData = async () => {
    try {
      const res = await getmyclass('西南石油大学');
      setMyclass(res.data.data);
      console.log(res);
    } catch (error) {
      console.error('获取课程失败', error);
    }
  };

  useEffect(() => {
    getMyclassData();
  }, []);

  return (
    <section style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#4f46e5' }}>本校课程列表</h2>
      {myclass.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: 16, color: '#999' }}>暂无课程数据</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {myclass.map((item) => (
            <li
              key={item.id}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)')}
            >
              <h3 style={{ margin: '0 0 8px', color: '#2563eb' }}>{item.department}</h3>
              <p><strong>教师：</strong>{item.teacher}</p>
              <p><strong>时间：</strong>{item.time}</p>
              <p><strong>描述：</strong>{item.description}</p>
              <p style={{ fontStyle: 'italic', color: '#6b7280' }}><small>大学：{item.university}</small></p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Myclass;
