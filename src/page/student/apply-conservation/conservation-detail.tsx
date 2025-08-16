import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getdetailconversation,sendmessage } from '../../../api/student/user';
import './conservation-detail.scss'; // 我们会写样式

//明天进行对学生发送消息的封住
// 消息类型
interface Message {
  id: string;
  senderType: 'student' | 'enterprise';
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

const ConservationDetail = () => {

  const params = useParams();
  const enterpriseId = Number(params.id); // 从路由中获取企业 ID
  const conversationId = params.conversationid as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [studnetmessage,setStudnetMessage] = useState<Message[]>([])

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
const send = async () => {
    const res = await sendmessage(1001,enterpriseId,inputValue,'student')
    console.log(res);
     getdetailconversations();
  }
  // 假设当前学生 ID（实际应从登录状态获取）
  const studentId = 1001;

  // 获取聊天记录
  const getdetailconversations = async () => {

    try {
      const res = await getdetailconversation(conversationId, 1001, enterpriseId);
      console.log(res);

      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('加载消息失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getdetailconversations();
  }, []);

  // 发送消息（占位功能）

  // 格式化时间（如：10:30 / 昨天 / 04-05）
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getDate() - date.getDate();

    if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return '昨天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="chat-container">
      {/* 聊天标题栏 */}
      <div className="chat-header">
        <h3>与企业沟通中</h3>
        <span className="enterprise-info">企业 ID: {enterpriseId}</span>
      </div>

      {/* 消息列表 */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="empty">暂无消息记录，可发送第一条消息</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id || msg.timestamp}
              className={`message-bubble ${
                msg.senderType === 'student' ? 'mine' : 'theirs'
              }`}
            >
              {/* 对方消息显示头像和名字 */}
              {msg.senderType !== 'student' && (
                <div className="sender-info">
                  <strong>{msg.senderName}</strong>
                </div>
              )}

              <div className="message-content">
                <p>{msg.content}</p>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="请输入消息..."


          className="chat-input"
        />
        <button   onClick={()=>{
            if(!inputValue){
              alert('请输入消息')
              return
            }
            send()
            setInputValue('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
             if(!inputValue){
              alert('请输入消息')
              return

            }
            send()
            setInputValue('')

            }
          }} className="send-btn">
          发送
        </button>
      </div>
    </div>
  );
};

export default ConservationDetail;