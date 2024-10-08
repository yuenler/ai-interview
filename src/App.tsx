import Interview from './pages/Interview';
// import './App.scss';
import React, { useState } from 'react';
import Permissions from './pages/Permissions';
import Instructions from './pages/Instructions';
import Login from './pages/Login';
import Signup from './pages/Signup';


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
        return <Interview />;
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  return (
      renderPage()
  );
};

export default App;
