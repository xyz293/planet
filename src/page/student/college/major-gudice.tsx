import { getmajor,getgudice } from '../../../api/student/college'
import { useEffect, useState } from 'react'
import './major.scss'

interface MajorGudiceProps {
  advice:string
  major:string
   recommendedPositions: string[]
  skillsRequired: string[]

}
const MajorGudice = () => {
  const [major, setMajor] = useState<string[]>([])
  const [gudice, setGudice] = useState<MajorGudiceProps[]>([])
  const showgudice = async () => { 
    const res = await getgudice()
    console.log('gudice数据:', res)
    setGudice(res.data.data)
  }

  const showmajor = async () => {
    try {
      const res = await getmajor()
      console.log('major数据:', res.data.data)
      setMajor(res.data.data)
    } catch (error) {
      console.error('获取专业列表失败', error)
    }
  }

  useEffect(() => {
    showmajor()
    showgudice()
  }, [])
   const [detail, setDetail] = useState<MajorGudiceProps>()
    const [ishow, setIshow] = useState<boolean>(true)
 
 

  return (
    <div className="major-gudice-container">
    <h3 className="title">专业选择</h3>

    <div className="major-gudice major-list">
      {major.length === 0 ? (
        <p>加载中...</p>
      ) : (
        major.map((item, index) => (
          <button key={index} className="major-btn" >   {/*这里需要写点击哪个按钮之后会出现按钮对应的内容 */}
            {item}
          </button>
        ))
      )}
    </div>

   {ishow&&<div className="major-gudice gudice-list">
      {gudice.map((item, index) => (
        <div key={index} className="gudice-item">
          <p><strong>专业：</strong>{item.major}</p>
          <p><strong>学习建议：</strong>{item.advice}</p>
          <p><strong>建议岗位：</strong>{item.recommendedPositions.join('、')}</p>
          <p><strong>建议技能：</strong>{item.skillsRequired.join('、')}</p>
        </div>
      ))}
    </div>} 
  </div>
  )
}

export default MajorGudice
