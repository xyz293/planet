import { getconserversation } from '../../../api/student/user';
import { useEffect, useState } from 'react';
import './conservation.scss';
import {useNavigate} from 'react-router-dom'


// 类型定义保持不变
interface EnterpriseInfo {
  id: number;
  name: string;
  logo: string | null;
}

interface Conversation {
  id: string;
  studentId: number;
  enterpriseId: number;
  enterprise: EnterpriseInfo;
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
  status: 'active' | 'closed';
  unreadCount: number;
}

// 时间格式化工具：显示“刚刚”、“10分钟前”等
const formatTimeAgo = (dateString: string) => {
 

  const now = new Date();
  const target = new Date(dateString);
  const diffInMs = now.getTime() - target.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  if (diffInHours < 24) return `${diffInHours}小时前`;
  if (diffInDays < 7) return `${diffInDays}天前`;
  return target.toLocaleDateString();
};

const Conservation = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const showConservation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getconserversation(1001);
      console.log(res);


      if (res.data.success) {
        setConversations(res.data.data);
      } else {
        setError(res.data.message || '获取会话失败');
      }
    } catch (err: any) {
      console.error('请求失败:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        '网络错误，请检查后端是否启动'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    showConservation();
  }, []);
   const navigate = useNavigate()
  return (
    <div className="conservation-container">
      <h1 className="title">💬 求职消息</h1>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          暂无会话记录
        </div>
      ) : (
        <ul className="conversation-list">
          {conversations.map((item) => (
            <li
             onClick={()=>{
                navigate(`/conservation/${item.enterprise
                .id}/${item.id}`)


             }}

              className={`conversation-item ${item.unreadCount > 0 ? 'unread' : ''}`}
              key={item.id}
            >
              <div className="avatar-wrapper">
                <img
                  src={item.enterprise.logo || '/default-company.png'}
                  alt={item.enterprise.name}
                  className="enterprise-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-company.png';
                  }}
                />
                {item.unreadCount > 0 && (
                  <span className="unread-dot"></span>
                )}
              </div>

              <div className="content">
                <div className="header">
                  <h3 className="enterprise-name">{item.enterprise.name}</h3>
                  <span
                    className={`status-badge ${
                      item.status === 'active' ? 'active' : 'closed'
                    }`}
                  >
                    {item.status === 'active' ? '沟通中' : '已结束'}
                  </span>
                </div>

                <p className="message-preview" title={item.lastMessage}>
                  {item.lastMessage.length > 50
                    ? item.lastMessage.slice(0, 50) + '...'
                    : item.lastMessage}
                </p>

                <div className="meta">
                  <span className="time">{formatTimeAgo(item.lastMessageTime)}</span>
                  {item.unreadCount > 0 && (
                    <span className="badge">{item.unreadCount}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Conservation;