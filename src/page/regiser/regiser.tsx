import { Input, Button } from "antd";
import "../regiser/regiser.scss"; 
import { sendcode,register } from "../../api/user";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const Register = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();


  const handleSendCode = async () => {
    try {
      const res = await sendcode(phone); // 👈 这里传对象（phone）
      console.log("验证码发送成功:", res);
    } catch (error) {
      console.error("验证码发送失败:", error);
    }
  };
  const handleRegister = async () => { 
    try { 
      const res = await register(phone,code,password);
      console.log("注册成功:", res);
      navigate("/login");
    } catch (error) { 
      console.error("注册失败:", error);
    }
  };

  return (
    <div className="register">
      {/* 左侧表单 */}
      <div className="register-form">
        <h2 className="register-title">注册账号</h2>
        <Input
          placeholder="请输入手机号"
          className="register-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input.Password
          placeholder="请输入密码"
          className="register-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="register-smsCode">
          <Input placeholder="验证码" className="register-smsCode-input"  value={code} onChange={(e) => setCode(e.target.value)}/>
          <Button type="default" onClick={handleSendCode} className="register-smsCode-btn">
            获取验证码
          </Button>
        </div>

        <Button type="primary" className="register-button" onClick={handleRegister} >
          注册
        </Button>
      </div>
    </div>
  );
};

export default Register;
