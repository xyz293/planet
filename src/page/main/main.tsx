
import React from 'react';
import './Main.css';
import { useState } from 'react';
import {useNavigate} from 'react-router-dom'

const Main = () => {
    const navigate = useNavigate();
    const [isselected,setIsselected]=useState(true);
    const studentClick=()=>{
        setIsselected(!isselected);
        navigate('/student')
    }
  return (
    <div className="container">
      {isselected&&<form className="form-box">
        <p className="title">请选择你的身份</p>
        <div className="button-group">
          <button type="button" className="btn" onClick={studentClick}>学生</button>
          <button type="button" className="btn">学校</button>
          <button type="button" className="btn">企业</button>
        </div>
      </form>}
    </div>
  );
};

export default Main;
