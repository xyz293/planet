import { jobs } from '../../../api/company/leader';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom'

interface ApplicationWithStudentInfo {
  status: string;
  studentEmail: string;
  studentId: number;
  studentName: string;
  studentPhone: string;
  timestamp: string;
}

const statusColors: Record<string, string> = {
  '待处理': '#f0ad4e',
  '已通过': '#5cb85c',
  '已拒绝': '#d9534f',
};

const StudentJobDetail = () => {
  const navigate = useNavigate()

  const [applications, setApplications] = useState<ApplicationWithStudentInfo[]>([]);
  const { id } = useParams();

  const fetchApplications = async () => {
    try {
      const res = await jobs(Number(id));
      setApplications(res.data.data);
    } catch (error) {
      console.error('获取投递详情失败:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplications();
    }
  }, [id]);

  if (applications.length === 0) {
    return <div style={styles.empty}>暂无人投递</div>;
  }

  return (
    <div style={styles.container}>
      {applications.map((app) => (
        <div key={app.studentId} style={styles.card}>
          <div style={styles.header}>
            <div style={styles.avatar}>{app.studentName[0]}</div>
            <div style={styles.info}>
              <h3 style={styles.name}>姓名：{app.studentName}</h3>
              <p style={styles.contact}>联系邮箱：{app.studentEmail} | 联系电话：{app.studentPhone}</p>

            </div>
            <span
              style={{
                ...styles.statusTag,
                backgroundColor: statusColors[app.status] || '#777',
              }}
            >
              {app.status}
            </span>
          </div>
          <div style={styles.footer}>
            <span>申请时间：{new Date(app.timestamp).toLocaleString()}</span>
           <button onClick={()=>navigate(`/studentdetail/${app.studentId}`)} style={{ marginLeft: '500px' }}>查看详情</button>


          </div>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 900,
    margin: '30px auto',
    padding: '0 20px',
  },
  empty: {
    textAlign: 'center',
    fontSize: 18,
    color: '#999',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    padding: 20,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    userSelect: 'none',
  },
  info: {
    flexGrow: 1,
  },
  name: {
    margin: 0,
    fontSize: 20,
    color: '#333',
  },
  contact: {
    margin: 0,
    fontSize: 14,
    color: '#666',
  },
  statusTag: {
    padding: '6px 14px',
    borderRadius: 20,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    userSelect: 'none',
  },
  footer: {
    fontSize: 13,
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: 12,
  },
};

export default StudentJobDetail;
