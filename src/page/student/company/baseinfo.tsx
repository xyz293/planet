import { getcompany ,getcompany1} from '../../../api/student/company'
import { useEffect, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import DetailPage from './detail-page'
interface Job {
  id: number;
  enterpriseId: number;
  title: string;
  description: string;
  requiredSkills: string[];
  salary: string;
  location: string;
  // 可选：添加更多字段，如发布时间
  // createdAt?: string; 
}


interface Company {
  id: number
  enterpriseId: number

  company: string
  location: string
  position: string
  salary: string
  jobDetail:Job

}

const Baseinfo = () => {
    const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchdetail, setSearchDetail] = useState<Company[]>([])
  const [showsearch, setShowSearch] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [showDetail, setShowDetail] = useState(true)
  const [showbutton, setShowbutton] = useState(false)

  const getDetail = (id: number) => {
    navigate(`/company/${id}`)
    console.log('查看公司详情，ID:', id)
  }

  const fetchCompanies = async () => {
    try {
      const res = await getcompany()
      setCompanies(res.data.data)
      console.log(res)

    } catch (error) {
      console.error('获取公司信息失败:', error)
    }
  }
  const search= async ()=>{
    const res = await getcompany1({keyword})
    console.log(res.data.data)
    setSearchDetail(res.data.data)
    console.log(searchdetail)
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        {showbutton&&<button onClick={()=>{{setShowSearch(false)}
        setShowDetail(true)
        setShowbutton(false)
        setKeyword('')
   }}>返回</button>}
       <input
       value={keyword}
       onChange={(e) => setKeyword(e.target.value)}
       onKeyDown={async (e) => {
         if (e.key === 'Enter') {
            setShowDetail(false)
              setShowbutton(true)
            setShowSearch(true)
            
            await search()
         }
       }}
  type="text"
  placeholder="搜索公司"
  style={{
    width: '100%',
    maxWidth: 400,
    padding: '10px 16px',
    fontSize: 16,
    borderRadius: 24,
    border: '1.5px solid #ccc',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    marginBottom: 24,
  }}
  onFocus={e => {
    e.currentTarget.style.borderColor = '#3b82f6'
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'
  }}
  onBlur={e => {
    e.currentTarget.style.borderColor = '#ccc'
    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
  }}
/>  
     {showsearch&&<DetailPage searchdetail={searchdetail} />}

 {showDetail && <div>
      <h1 style={{ textAlign: 'center', marginBottom: 24, color: '#333' }}>公司信息</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {companies.map((item) => (
          <li
            key={item.id}
            onClick={() => getDetail(item.id)}
            style={{
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 8,
              padding: 20,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLLIElement).style.transform = 'scale(1.03)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLLIElement).style.transform = 'scale(1)'
            }}
          >
            <h2 style={{ marginBottom: 8, color: '#007acc' }}>{item.company}</h2>
            <p style={{ margin: '4px 0', color: '#555' }}>
              <strong>地点:</strong> {item.location}
            </p>
          </li>
        ))}
      </ul>
      </div>}
    </div>
  )
}

export default Baseinfo
