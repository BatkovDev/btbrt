import './App.css';
import Chat from './components/Chat';
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `You are LegalKazBot, an AI assistant specialized exclusively in legislation and правоприменительной практике Республики Казахстан. Your scope is strictly limited to:
        1. Нормативно-правовые акты Республики Казахстан (Конституция, законы, кодексы, подзаконные акты).
        2. Официальный текст и официальные разъяснения, опубликованные на портале Adilet (https://adilet.zan.kz/).
        3. Комментарии и судебная практика по РК только в контексте пояснения конкретных норм.
      
      — Всегда при ответе:
         • Указывайте полное наименование акта с указанием даты принятия и последней редакции,  
         • Приводите номер и название статьи или пункта,  
         • Даёте прямую ссылку на соответствующую страницу портала Adilet.

      — Если вопрос выходит за рамки законодательства РК или требует профессиональной консультации:
         «Извините, я не могу прокомментировать этот запрос — моя специализация — законодательство Республики Казахстан. Для получения консультации обратитесь к лицензированному юристу.»`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const history = await response.json();
      const grouped = history.reduce((acc, msg) => {
        if (!acc[msg.sessionId]) acc[msg.sessionId] = [];
        acc[msg.sessionId].push({ role: msg.role, content: msg.message });
        return acc;
      }, {});
      const sessionList = Object.entries(grouped).map(([id, messages]) => ({ id, messages }));
      setSessions(sessionList);
      console.log('Sessions set:', sessionList);
      if (sessionList.length > 0) {
        setCurrentSessionId(sessionList[0].id);
        setMessages(sessionList[0].messages);
      } else {
        newSession();
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const newSession = () => {
    const newSessionId = Date.now().toString();
    setSessions(prev => [...prev, { id: newSessionId, messages: [] }]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };

  const selectSession = (sessionId) => {
    const selectedSession = sessions.find(s => s.id === sessionId);
    if (selectedSession) {
      setCurrentSessionId(sessionId);
      setMessages(selectedSession.messages);
      console.log('Selected session:', sessionId, 'Messages:', selectedSession.messages);
    }
  };

  const send = async () => {
    if (!input.trim() || !currentSessionId) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      setSessions(prevSessions => prevSessions.map(s => s.id === currentSessionId ? { ...s, messages: newMessages } : s));
      return newMessages;
    });
    setInput('');
    setLoading(true);

    try {
      // Save user message to backend
      await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, sessionId: currentSessionId, message: input, role: 'user' }),
      });

      // Send to AI
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [...messages, userMessage],
        }),
      });
      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.choices[0].message.content };

      // Add AI response to messages
      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        setSessions(prevSessions => prevSessions.map(s => s.id === currentSessionId ? { ...s, messages: newMessages } : s));
        return newMessages;
      });

      // Save AI response to backend
      await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, sessionId: currentSessionId, message: aiMessage.content, role: 'assistant' }),
      });
    } catch (err) {
      console.error('Error in send function:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Auth setUser={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <Navbar user={user} setUser={setUser} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-p flex flex-1 overflow-hidden">
      <Sidebar
          user={user}
          sessions={sessions}
          onSelectSession={selectSession}
          newSession={newSession}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentSessionId={currentSessionId}
        />
        <Chat
          user={user}
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loading={loading}
          send={send}
        />
      </div>
    </div>
  );
}

export default App;