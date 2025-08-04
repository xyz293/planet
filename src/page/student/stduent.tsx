import React from 'react';
import UserInfo from '../student/info/userinfon'
import Baseinfo from '../student/company/baseinfo'
import {useState} from 'react';
import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudOutlined,
  ShopOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';

const { Header, Content, Footer, Sider } = Layout;

const siderStyle = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
};

const items = [
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
  BarChartOutlined,
  CloudOutlined,
 
].map((icon, index) => {
  const labels = [
   '个人信息',
   '公司信息'
  ];
  return {
    key: String(index + 1),
    icon: React.createElement(icon),
    label: labels[index],
  };
});

const Student = () => {
   const renderContent = () => {
    switch (index) {
      case '1':
        return <UserInfo />;
      case '2':
        return <Baseinfo/>;
      case '3':
        return <div>这里是上传中心内容</div>;
      case '4':
        return <div>这里是数据统计内容</div>;
      case '5':
        return <div>这里是云服务内容</div>;
      default:
        return null;
    }
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
 const [index,setIndex] = useState('1')
  return (
    <Layout hasSider>
      <Sider style={siderStyle}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={[index]} items={items} onClick={(e)=>{setIndex(e.key)}} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
           {renderContent()}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} 由 Ant UED 创建
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Student;
