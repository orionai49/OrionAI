
import React, { useState } from 'react';
import { SPARK_ICON } from '../constants';

interface AuthViewProps {
  onLogin: (username: string) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = username.trim().toLowerCase();
    const finalPassword = password.trim();

    if (!finalUsername || !finalPassword) {
      setError('Username and password cannot be empty.');
      return;
    }
    setError('');

    try {
        const users = JSON.parse(localStorage.getItem('orion_users') || '{}');

        if (isLogin) {
            if (users[finalUsername] && users[finalUsername] === finalPassword) {
                onLogin(finalUsername);
            } else {
                setError('Invalid username or password.');
            }
        } else { // Register
            if (users[finalUsername]) {
                setError('Username already exists.');
            } else {
                const newUsers = { ...users, [finalUsername]: finalPassword };
                localStorage.setItem('orion_users', JSON.stringify(newUsers));
                onLogin(finalUsername); // Auto-login after registration
            }
        }
    } catch (err) {
        setError('An error occurred. Please try again.');
        console.error("Auth error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
              {SPARK_ICON}
              <h1 className="text-3xl font-bold text-white">OrionAI</h1>
          </div>
          <h2 className="text-xl text-gray-300">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
            >
              {isLogin ? 'Sign in' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-cyan-400 hover:text-cyan-300">
            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
