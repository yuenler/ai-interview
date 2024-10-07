import { ConsolePage } from './pages/ConsolePage';
// import './App.scss';
import React, { useState } from 'react';
import Permissions from './components/Permissions';
import Instructions from './components/Instructions';
import LoginSignupPage from './components/LoginSignupPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('interview');

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginSignupPage navigateTo={navigateTo} />;
      case 'permissions':
        return <Permissions navigateTo={navigateTo} />;
      case 'instructions':
        return <Instructions navigateTo={navigateTo} />;
      case 'interview':
        return <ConsolePage />;
      default:
        return <LoginSignupPage navigateTo={navigateTo} />;
    }
  };

  return (
      renderPage()
  );
};

export default App;
