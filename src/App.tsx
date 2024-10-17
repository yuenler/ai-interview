// App.tsx
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import Interview from './pages/Interview';
import Permissions from './pages/Permissions';
import Instructions from './pages/Instructions';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<User | null>(null);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // User is signed in
        setCurrentPage('permissions');
      } else {
        // User is signed out
        setCurrentPage('login');
      }
    });

    return () => unsubscribe();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login navigateTo={navigateTo} />;
      case 'signup':
        return <Signup navigateTo={navigateTo} />;
      case 'permissions':
        return <Permissions navigateTo={navigateTo} />;
      case 'instructions':
        return <Instructions navigateTo={navigateTo} />;
      case 'interview':
        return <Interview />;
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  return renderPage();
};

export default App;
