import {login} from '../../api/student/user'
import { useState } from 'react'
import userstore from '../../store/user'
import './login.scss'
import { useNavigate ,Link} from 'react-router-dom'
const Login = () => {
    const navigate = useNavigate()
    
    const {id,setId} = userstore()
    const getlogin = async () => {
        const res = await login(phone,password)
          if(res.data.success === true){
            alert('登录成功')
            console.log(res)
            setId(res.data.user.id)
            navigate('/main')
          }
          else {
            alert('登录失败')
            navigate('/regiser')
          }
    }
    const [phone,setPhone] = useState('')
    const [password,setPassword] = useState('')
    return ( <div className="login-container">
    <div className="login-box">
      <h2>用户登录</h2>
      <input
        type="text"
        placeholder="请输入手机号"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="请输入密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Link to='/regiser'>忘记密码</Link>
      <button onClick={getlogin}>登录</button>
    </div>
  </div>)
}
export default Login;