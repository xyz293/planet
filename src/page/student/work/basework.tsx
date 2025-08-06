import { myapply } from '../../../api/student/user'
import { useEffect, useState } from 'react'
import { getjobdetail } from '../../../api/student/company'

interface Application {
  id: number;
  jobId: number;
  status: string;
  timestamp: string;
}

const Basework = () => {
  const [applications, setApplications] = useState<Application[]>([])

  const showmyapply = async () => {
    const res = await myapply(1001)
    setApplications(res.data.data)
    console.log(res)
  }

  useEffect(() => {
    showmyapply()
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: 20 }}>我的求职记录</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {applications.map(item => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 16,
              width: 260,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              backgroundColor: '#f9f9f9',
            }}
          >
            <p><strong>状态:</strong> <span style={{ color: '#2980b9' }}>{item.status}</span></p>
            <p><strong>时间:</strong> {new Date(item.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Basework
