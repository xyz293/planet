import { getcompanyjob } from '../../../api/company/leader';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReceivedApplication {
  location: string;
  jobId: number;
  postedAt: string;
  salary: string;
  status: string;
  title: string;
  views: number;
  workType: string;
}

const JobSeekerList = () => {
  const [candidates, setCandidates] = useState<ReceivedApplication[]>([]);
  const navigate = useNavigate();

  const fetchJob = async () => {
    try {
      const res = await getcompanyjob(5003);
      setCandidates(res.data);
    } catch (err) {
      console.error('获取职位失败:', err);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  const getdetail = (id: number) => {
    navigate('/jobdetail/' + id);
  };

  return (
    <div style={styles.container}>
      {candidates.map((item) => (
        <div
          key={item.jobId}
          style={styles.card}
          onClick={() => getdetail(item.jobId)}
        >
          <h3 style={styles.title}>{item.title}</h3>
          <div style={styles.infoRow}>
            <span>📍 {item.location}</span>
            <span>💼 {item.workType}</span>
            <span>💰 {item.salary}</span>
          </div>
          <div style={styles.footer}>
            <span>发布时间: {item.postedAt}</span>
            <span>浏览量: {item.views}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    padding: '20px',
  },
  card: {
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  title: {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#333',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '10px',
    color: '#666',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999',
  },
};

export default JobSeekerList;
