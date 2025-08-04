import { getUserInfo, updateUserInfo } from '../../../api/user'
import { useEffect, useState } from 'react'
import userStore from '../../../store/user'
import UpdatePage from './update-page'
import { FloatButton } from 'antd'
import './info.scss'

interface updateUserInfoParams {
  id: number
  name: string
  role?: string
  education: string
  major: string
  age: number
  university: string
}

const UserInfo = () => {
  const { id } = userStore()
  const [user, setUser] = useState<updateUserInfoParams | null>(null)

  const showinfo = async () => {
    const res = await getUserInfo(213967258)  // 或者用 id
    console.log(res)
    setUser(res.data.user)
    console.log(id)
  }

  useEffect(() => {
    showinfo()
  }, [])

  const [ishow, setIshow] = useState(false)
  const [buttonshow, setButtonshow] = useState(true)

  return (
    <div>
      {ishow && <UpdatePage setIshow={setIshow} setButtonshow={setButtonshow} setUser={setUser}  />}
      {buttonshow && (
        <FloatButton
          onClick={() => {
            setIshow(true)
            setButtonshow(false)
            setUser(null)
          }}
        />
      )}

      {/* 渲染用户信息 */}
      {user && (
       <div className="user-info-container">
  <h3>个人信息</h3>
  <div className="info-item">
    <span className="label">姓名：</span>
    <span className="value">{user.name}</span>
  </div>
  <div className="info-item">
    <span className="label">学历：</span>
    <span className="value">{user.education}</span>
  </div>
  <div className="info-item">
    <span className="label">专业：</span>
    <span className="value">{user.major}</span>
  </div>
  <div className="info-item">
    <span className="label">年龄：</span>
    <span className="value">{user.age}</span>
  </div>
  <div className="info-item">
    <span className="label">大学：</span>
    <span className="value">{user.university}</span>
  </div>
</div>
      )}
    </div>
  )
}

export default UserInfo
