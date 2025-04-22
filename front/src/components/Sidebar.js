function Sidebar({ user, sessions, onSelectSession, newSession, isOpen, toggleSidebar, currentSessionId }) {
  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-gray-50 dark:bg-gray-800 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-20`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">История</h2>
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-2 overflow-y-auto h-full">
        {sessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">История пуста.</p>
        ) : (
          sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
                session.id === currentSessionId ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              {new Date(parseInt(session.id)).toLocaleString()}
            </button>
          ))
        )}
        <button
          onClick={newSession}
          className="w-full text-left p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          Новый чат
        </button>
      </div>
    </div>
  );
}

export default Sidebar;