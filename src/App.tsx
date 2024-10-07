import { ConsolePage } from './pages/ConsolePage';
// import './App.scss';
import React, { useState } from 'react';
import Permissions from './components/Permissions';
import Instructions from './components/Instructions';
import Login from './components/Login';
import Signup from './components/Signup';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

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
        return <ConsolePage />;
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  return (
      renderPage()
  );
};

export default App;
