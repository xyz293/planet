import {useNavigate} from 'react-router-dom'
const DetailPage = ({ searchdetail }) => {
    const navigate = useNavigate()
    const getdetail = (id: number) => { 
        navigate(`/company/${id}`)
    }
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", padding: '0 16px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32, color: '#2c3e50' }}>公司详情</h1>
      {searchdetail.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999' }}>暂无搜索结果</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {searchdetail.map((item, index) => (
            <div
             onClick={() => {
        getdetail(item.id)
        }}
              key={item.id}
              style={{
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: 12,
                padding: 24,
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-6px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h2 style={{ marginBottom: 12, color: '#3498db' }}>{item.company}</h2>
              <p style={{ margin: '6px 0', color: '#555' }}>
                <strong>地点：</strong> {item.location}
              </p>
              <p style={{ margin: '6px 0', color: '#555' }}>
                <strong>职位：</strong> {item.position}
              </p>
              <p style={{ margin: '6px 0', color: '#555', fontWeight: '600' }}>
                <strong>薪资：</strong> {item.salary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DetailPage
