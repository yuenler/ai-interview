import React, { useState } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Login: React.FC<Props> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform login/signup logic here
    navigateTo('permissions');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <form
        className="bg-white p-8 rounded shadow-md w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login / Signup</h2>
        <div className="mb-4">
          <label className="block text-gray-700">Email:</label>
          <input
            type="email"
            className="w-full mt-2 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Password:</label>
          <input
            type="password"
            className="w-full mt-2 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default Login;
