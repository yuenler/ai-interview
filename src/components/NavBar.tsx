// NavBar.tsx
import React, { useContext } from 'react';
import { auth } from '../firebase';
import { UserContext } from '../UserContext';

interface Props {
  navigateTo: (page: string) => void;
}

const NavBar: React.FC<Props> = ({ navigateTo }) => {
  const { user } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigateTo('login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-xl font-bold text-gray-800">Your App Name</span>
        </div>
        <div>
          <span className="mr-4 text-gray-700">Hello, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
