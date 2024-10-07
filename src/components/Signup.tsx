import React, { useState } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Signup: React.FC<Props> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform signup logic here
    navigateTo('permissions');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-10 rounded-md shadow-lg max-w-sm w-full border border-gray-200"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Sign Up</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Email:</label>
          <input
            type="email"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium">Password:</label>
          <input
            type="password"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-3 rounded-md hover:bg-gray-700 transition duration-300"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
