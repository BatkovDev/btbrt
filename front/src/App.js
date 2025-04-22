import './App.css';
import Chat from './components/Chat';
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch chat sessions when user is authenticated
  useEffect(() => {
    if (user) {
      const fetchChats = async () => {
        try {
          const response = await fetch('http://localhost:3001/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id }),
          });
          if (!response.ok) throw new Error('Failed to fetch chat history');
          const history = await response.json();
          const groupedChats = history.reduce((acc, msg) => {
            if (!acc[msg.sessionId]) acc[msg.sessionId] = [];
            acc[msg.sessionId].push({ role: msg.role, content: msg.message });
            return acc;
          }, {});
          const chatList = Object.entries(groupedChats).map(([id, messages]) => ({ id, messages }));
          setChats(chatList);
        } catch (err) {
          console.error('Error fetching chats:', err);
        }
      };
      fetchChats();
    }
  }, [user]);

  const newChat = () => {
    const newChatId = Date.now().toString();
    setChats((prevChats) => {
      if (!prevChats.some((c) => c.id === newChatId)) {
        return [...prevChats, { id: newChatId, messages: [] }];
      }
      return prevChats;
    });
    return newChatId;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) return <Auth setUser={setUser} />;

  return (
    <Router>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <Navbar user={user} setUser={setUser} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} handleLogout={handleLogout} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            user={user}
            chats={chats}
            onNewChat={newChat}
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <Routes>
            <Route path="/chat/:chatId" element={<ChatWrapper chats={chats} setChats={setChats} user={user} />} />
            <Route path="/" element={<ChatWrapper chats={chats} setChats={setChats} user={user} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Wrapper component to handle chatId
function ChatWrapper({ chats, setChats, user }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const effectiveChatId = chatId || Date.now().toString();

  useEffect(() => {
    if (!chatId) {
      const newChatId = Date.now().toString();
      setChats((prevChats) => {
        const chatExists = prevChats.some((c) => c.id === newChatId);
        if (!chatExists) {
          return [...prevChats, { id: newChatId, messages: [] }];
        }
        return prevChats;
      });
      navigate(`/chat/${newChatId}`);
    }
  }, [chatId, navigate, setChats]);

  return <Chat chats={chats} setChats={setChats} currentChatId={effectiveChatId} user={user} />;
}

export default App;