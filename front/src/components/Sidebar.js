import React from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Sidebar({ user, chats, onNewChat, isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-20 border-r border-gray-300`}
    >
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">История чатов</h2>
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-2 overflow-y-auto h-full">
        <button
          onClick={() => {
            const newChatId = onNewChat(); // Создание нового чата
            toggleSidebar(); // Закрытие боковой панели, если нужно
            navigate(`/chat/${newChatId}`); // Переход на новый чат
          }}
        >
          + Новый чат
        </button>
        {chats.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Нет чатов.</p>
        ) : (
          chats.map((chat) => (
            <NavLink
              key={chat.id}
              to={`/chat/${chat.id}`}
              className={({ isActive }) =>
                `block p-2 rounded-md ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`
              }
              onClick={toggleSidebar}
            >
              Чат от {new Date(parseInt(chat.id)).toLocaleString()}
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;