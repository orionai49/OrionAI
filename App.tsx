
import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import MainLayout from './components/MainLayout';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in localStorage on initial load
    try {
      const storedUser = localStorage.getItem('orion_currentUser');
      if (storedUser) {
        setCurrentUser(storedUser);
      }
    } catch (error) {
        console.error("Failed to access localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string) => {
    try {
        localStorage.setItem('orion_currentUser', username);
        setCurrentUser(username);
    } catch (error) {
        console.error("Failed to set user in localStorage:", error);
    }
  };

  const handleLogout = () => {
    try {
        localStorage.removeItem('orion_currentUser');
        setCurrentUser(null);
    } catch (error) {
        console.error("Failed to remove user from localStorage:", error);
    }
  };
  
  // Render a loading state to avoid flash of content
  if (isLoading) {
    return (
        <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white font-sans">
      {currentUser ? (
        <MainLayout username={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthView onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
