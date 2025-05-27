import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import Login from './components/Login';
import styles from './App.module.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); // save user data to localStorage
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  return (
    <div>
      {/* Navbar only if logged in */}
      {user && (
        <nav className={styles.navbar}>
          <h1 className={styles.title}>Memory Matching Game</h1>
          <button onClick={handleLogout} className={styles.navButton}>
            Logout
          </button>
        </nav>
      )}

      {/* Main content */}
      <div className={styles.app}>
        {!user ? (
          view === 'login' ? (
            <Login onLogin={handleLogin} />
          ) : (
            <div>Signup component placeholder</div>
          )
        ) : (
          <Board user={user} />
        )}
      </div>
    </div>
  );
}

export default App;
