import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import '../styles/Chat.css';

export default function Chat({ user }) {
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
     «Извините, я не могу прокомментировать этот запрос — моя специализация — законодательство Республики Казахстан. Для получения консультации обратитесь к лицензированному юристу.»`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Fetch chat history when the component mounts or user changes
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:3001/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        });
        const history = await response.json();
        const formattedHistory = history.map((msg) => ({
          role: 'user',
          content: msg.message,
        }));
        setMessages((prev) => [...prev, ...formattedHistory]);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    fetchHistory();
  }, [user]);

  // Scroll to the latest message
  useEffect(() => {
    chatContainerRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const respUser = await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, message: input }),
      });
      console.log('User message save:', respUser.status);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: updatedMessages,
        }),
      });
      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.choices[0].message.content };

      setMessages((prev) => [...prev, aiMessage]);

      await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, message: aiMessage.content }),
      });
    } catch (err) {
      console.error('Error in sendMessage function:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the chat.</div>;
  }

  return (
    <div className="chat-container flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div
        ref={chatContainerRef}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <img src="/bot-avatar.png" alt="Бот" className="w-8 h-8 rounded-full mr-2" />
            )}
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm break-words ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-indigo-600" {...props} />
                  ),
                  mark: ({ node, ...props }) => (
                    <mark className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded" {...props} />
                  ),
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
            {m.role === 'user' && (
              <img src="/user-avatar.jpg" alt="Вы" className="w-8 h-8 rounded-full ml-2" />
            )}
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4 flex items-center">
        <input
          type="text"
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring"
          placeholder="Введите сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="ml-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring"
        >
          ↗️
        </button>
      </div>
    </div>
  );
}