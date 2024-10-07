import React from 'react';
import Login from './Login';
import Signup from './Signup';

interface Props {
  navigateTo: (page: string) => void;
}

const LoginSignupPage: React.FC<Props> = ({ navigateTo }) => {
  const [activeForm, setActiveForm] = React.useState<'login' | 'signup' | null>(null);

  const handleFormChange = (form: 'login' | 'signup') => {
    setActiveForm(form);
  };

  if (activeForm === 'login') {
    return <Login navigateTo={navigateTo} />;
  }

  if (activeForm === 'signup') {
    return <Signup navigateTo={navigateTo} />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-200">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">Welcome</h2>
        <p className="mb-8 text-gray-600">Please log in or sign up to continue.</p>
        <button
          onClick={() => handleFormChange('login')}
          className="bg-gray-800 text-white py-3 px-6 rounded-md w-full mb-4 hover:bg-gray-700 transition duration-300"
        >
          Login
        </button>
        <button
          onClick={() => handleFormChange('signup')}
          className="bg-gray-800 text-white py-3 px-6 rounded-md w-full hover:bg-gray-700 transition duration-300"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default LoginSignupPage;
