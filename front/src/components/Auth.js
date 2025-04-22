import React, { useState } from 'react';

function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    console.log(1231);
    const endpoint = isLogin ? '/login' : '/register';
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // Sending email and password
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error); // Display error from backend (e.g., "User already exists")
      } else {
        setUser({ id: data.id, email: data.email || email }); // Set user state with response data
        setError('');
      }
    } catch (err) {
      setError('Error connecting to the server');
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-blue-500 hover:underline"
          >
            {isLogin ? 'Need to register?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;