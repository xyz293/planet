import { useEffect, useState } from 'react';
import { getresourse } from '../../../api/student/college';
import Resourse from '../college/resourse';
import Myclass from '../college/my-class'
import CollegeList from '../college/college-list'
import MajorGudice from '../college/major-gudice'

const buttonStyles = {
  base: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    color: '#fff',
    backgroundColor: '#4f46e5', // 统一主色调（高校蓝）
    fontWeight: '600',
    cursor: 'pointer',
    margin: '8px',
    fontSize: '16px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
  },
  hover: {
    backgroundColor: '#4338ca', // hover 更深一点的蓝色
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
};

const CollegeGudice = () => {
  const [Resourseshow, setResourseshow] = useState(false);
  const [Myclassshow, setMyclassshow] = useState(true);  

  useEffect(() => {
    const show = async () => {
      const res = await getresourse();
      console.log(res);
    };
    show();
  }, []);

  const handleMouseEnter = (e) => {
    Object.assign(e.target.style, buttonStyles.hover);
  };

  const handleMouseLeave = (e) => {
    Object.assign(e.target.style, {
      backgroundColor: buttonStyles.base.backgroundColor,
      transform: 'none',
      boxShadow: buttonStyles.base.boxShadow,
    });
  };
  const [index, setIndex] = useState('1');
  const getcourse =()=>{
   switch (index) {
    case '1':
      return <Myclass />;
    case '2':
      return <Resourse />;
    case '4':
      return <CollegeList />;
   case '3':
      return <MajorGudice/>;
  }
}

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6', // 淡灰色背景，视觉更清爽
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 60,
        fontFamily: 'Arial, sans-serif',
        color: '#111827',
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 40 }}>
        🎓 大学生职业资源推荐
      </h1>

      <div>
        <button
          onClick={() => setIndex('1')}
          style={{ ...buttonStyles.base }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          本校课程
        </button>
        <button
          onClick={() => setIndex('2')}
          style={{ ...buttonStyles.base }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          就业指南
        </button>
        <button
          onClick={() => setIndex('3')}
          style={{ ...buttonStyles.base }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          专业技术
        </button>
        <button
          onClick={() => setIndex('4')}
          style={{ ...buttonStyles.base }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          其他高校
        </button>
      </div>

      <div style={{ marginTop: 40, width: '80%', maxWidth: 800 }}>
       {getcourse()}
      </div>
    </div>
  );
};

export default CollegeGudice;
