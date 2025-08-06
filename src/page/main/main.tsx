
import React from 'react';
import './Main.css';
import { useState } from 'react';
import {useNavigate} from 'react-router-dom'
import {selectcredits} from '../../api/student/user'

const Main = () => {
    const navigate = useNavigate();
    const studentClick=async ()=>{
     const credits = await selectcredits(403854918,'student')
        navigate('/student')
    }
    const companyClick=async ()=>{
        navigate('/company')
    }
    const collegeClick=async ()=>{
        navigate('/college')
    }
  return (
    <div className="container">
    <form className="form-box">
        <p className="title">请选择你的身份</p>
        <div className="button-group">
          <button type="button" className="btn" onClick={studentClick}>学生</button>
          <button type="button" className="btn" onClick={collegeClick}>学校</button>
          <button type="button" className="btn" onClick={companyClick}>企业</button>
        </div>
      </form>
    </div>
  );
};

export default Main;
