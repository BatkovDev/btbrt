import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import '../styles/Chat.css';

export default function Chat({ chats, setChats, currentChatId, user }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingDots, setThinkingDots] = useState('.');
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const currentChat = chats.find((c) => c.id === currentChatId) || { id: currentChatId, messages: [] };

  // Animate thinking dots
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setThinkingDots((prev) => (prev === '...' ? '.' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Initialize displayed messages and handle typing animation
  useEffect(() => {
    setDisplayedMessages(currentChat.messages.map((msg) => ({ ...msg, displayedContent: msg.content })));
  }, [currentChat.messages]);

  // Typing animation for new assistant messages
  useEffect(() => {
    const lastMessage = currentChat.messages[currentChat.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.displayedContent) {
      let index = 0;
      const fullContent = lastMessage.content;
      const typingInterval = setInterval(() => {
        if (index < fullContent.length) {
          setDisplayedMessages((prev) =>
            prev.map((msg, i) =>
              i === currentChat.messages.length - 1
                ? { ...msg, displayedContent: fullContent.slice(0, index + 1) }
                : msg
            )
          );
          index++;
        } else {
          clearInterval(typingInterval);
        }
      }, 8); // Adjust speed (20ms per character)
      return () => clearInterval(typingInterval);
    }
  }, [currentChat.messages]);

  // Scroll to the latest message
  useEffect(() => {
    chatContainerRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // Derive username from email (e.g., "user" from "user@example.com")
  const username = user?.email ? user.email.split('@')[0] : 'Пользователь';

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const newMessage = { role: 'user', content: input };

    // Optimistically add user's message to the current chat
    setChats((prevChats) => {
      const chatExists = prevChats.some((c) => c.id === currentChatId);
      if (chatExists) {
        return prevChats.map((c) =>
          c.id === currentChatId ? { ...c, messages: [...c.messages, newMessage] } : c
        );
      } else {
        return [...prevChats, { id: currentChatId, messages: [newMessage] }];
      }
    });

    setInput('');
    setLoading(true);

    try {
      // Prepare messages for API request
      const currentMessages = currentChat.messages || [];
      const updatedMessages = [
        {
          role: 'system',
          content: `You are AdiletAI, an AI assistant specialized exclusively in the legislation and legal practice of the Republic of Kazakhstan. Your scope is limited to:
1. Normative-legal acts of Kazakhstan (Constitution, laws, codes, by-laws).
2. Official texts and explanations published on the Adilet portal (https://adilet.zan.kz/).
3. Comments and judicial practice in Kazakhstan, only to clarify specific norms.

**Instructions**:
- Respond in the same language as the user's input (Russian, English, or Kazakh).
- By default, provide concise, clear, and accessible answers suitable for all citizens, including teenagers, students, schoolchildren, and pensioners. Avoid technical jargon unless necessary.
- If the user requests detailed information (e.g., "explain in detail" or "provide full details"), include comprehensive explanations, citing relevant laws, articles, and judicial practice.
- Always include:
  - Full name of the legal act, its adoption date, and latest revision.
  - Specific article or clause number and title.
  - A direct link to the relevant Adilet portal page.
- If the question is outside Kazakhstan's legislation or requires professional legal advice, respond: 
  - In Russian: «Извините, я не могу прокомментировать этот запрос — моя специализация — законодательство Республики Казахстан. Для получения консультации обратитесь к лицензированному юристу.»
  - In English: "Sorry, I cannot comment on this request — my specialization is the legislation of the Republic of Kazakhstan. For advice, please consult a licensed lawyer."
  - In Kazakh: «Кешіріңіз, мен бұл сұрауға түсініктеме бере алмаймын — менің мамандығым — Қазақстан Республикасының заңнамасы. Кеңес алу үшін лицензиясы бар заңгерге хабарласыңыз.`,
        },
        ...currentMessages,
        newMessage,
      ];

      // Save user message to backend
      const respUser = await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          sessionId: currentChatId,
          message: input,
          role: 'user',
        }),
      });
      if (!respUser.ok) throw new Error('Не удалось сохранить сообщение пользователя.');

      // Check API key
      if (!process.env.REACT_APP_OPENROUTER_API_KEY) {
        throw new Error('API-ключ не найден в настройках окружения.');
      }

      // Send to OpenRouter API
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
      if (!res.ok) throw new Error(`Ошибка API: ${await res.text()}`);
      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.choices[0].message.content };

      // Add AI response to chats
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === currentChatId ? { ...c, messages: [...c.messages, aiMessage] } : c
        )
      );

      // Save AI response to backend
      const respAI = await fetch('http://localhost:3001/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          sessionId: currentChatId,
          message: aiMessage.content,
          role: 'assistant',
        }),
      });
      if (!respAI.ok) throw new Error('Не удалось сохранить ответ AI.');
    } catch (err) {
      console.error('Ошибка:', err);
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, { role: 'system', content: `Ошибка: ${err.message}` }] }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-gray-500 dark:text-gray-400">Please log in to access the chat.</div>;
  }

  return (
    <div className="apb flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
        {currentChat.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {getGreeting()}, {username}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Чем могу услужить?</p>
          </div>
        ) : (
          displayedMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {msg.displayedContent || msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-center items-center p-4">
            <p className="text-gray-500 dark:text-gray-400">Думаю над ответом{thinkingDots}</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-300 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
          className="flex-1 p-2 rounded-lg border border-gray-300 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}