import React,{useState} from 'react';
import { Button, Form, Input } from 'antd';
import {updateUserInfo} from '../../../api/user'
import userStore from '../../../store/user'
const onFinish = values => {
  console.log('提交的数据:', values);
  // 这里后面可以加 axios.put('/user/update', values) 调用接口
};

const onFinishFailed = errorInfo => {
  console.log('提交失败:', errorInfo);
};
const UpdatePage = ({setIshow,setButtonshow,setUser}) => {
  const showupdate=async()=>{
    const res = await updateUserInfo({
       id:213967258,
      name:name,
      education:education,
      major:major,
      age:Number(age),
      university:university
    })
    console.log(res)
   
    if(res.data.success==true){
      handleSubmit()
       setUser(res.data.user)
    }
   
  }
   const handleSubmit =()=>{
    setIshow(false)
    setButtonshow(true)
   }
  const [name,setName] = useState('')
  const [education,setEducation] = useState('')
  const [major,setMajor] = useState('')
  const [age,setAge] = useState('')
  const [university,setUniversity] = useState('')
  const [role,setRole] = useState('')

  return(
    <Form
    name="updateUser"
    labelCol={{ span: 6 }}
    wrapperCol={{ span: 14 }}
    style={{ maxWidth: 600, margin: '0 auto', marginTop: '40px' }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item
      label="姓名"
      name="name"
      rules={[{ required: true, message: '请输入姓名' }]}
    >
      <Input placeholder="请输入姓名" value={name} onChange={(e)=>setName(e.target.value)} />
    </Form.Item>

    {/* 学历 */}
    <Form.Item
      label="学历"
      name="education"
      rules={[{ required: true, message: '请输入学历（如：本科、硕士）' }]}
    >
      <Input placeholder="请输入学历" value={education} onChange={(e)=>setEducation(e.target.value)} />
    </Form.Item>

    {/* 专业 */}
    <Form.Item
      label="专业"
      name="major"
      rules={[{ required: true, message: '请输入专业' }]}
    >
      <Input placeholder="请输入专业" value={major} onChange={(e)=>setMajor(e.target.value)} />
    </Form.Item>

    {/* 年龄 */}
    <Form.Item
      label="年龄"
      name="age"
      rules={[{ required: true, message: '请输入年龄' }]}
    >
      <Input type="number" placeholder="请输入年龄" value={age} onChange={(e)=>setAge(e.target.value)} />
    </Form.Item>

    {/* 大学 */}
    <Form.Item
      label="大学"
      name="university"
      rules={[{ required: true, message: '请输入大学名称' }]}
    >
      <Input placeholder="请输入大学" value={university} onChange={(e)=>setUniversity(e.target.value)} />
    </Form.Item>

    {/* 提交按钮 */}
    <Form.Item wrapperCol={{ offset: 6, span: 14 }}>
      <Button type="primary" htmlType="submit" onClick={showupdate}>
        更新信息
      </Button>
    </Form.Item>
  </Form>
  
);
}

export default UpdatePage;
