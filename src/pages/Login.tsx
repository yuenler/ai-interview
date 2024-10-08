import React, { useState } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Login: React.FC<Props> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform login logic here
    navigateTo('permissions');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <form
        className="bg-white p-10 rounded-md shadow-lg max-w-sm w-full border border-gray-200"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Sign in to continue
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold">Email</label>
          <input
            type="email"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold">Password</label>
          <input
            type="password"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="text-right mb-6">
          <a
            href="#"
            className="text-sm font-bold text-blue-600 hover:underline"
            onClick={() => navigateTo('forgot-password')}
          >
            Forgot password?
          </a>
        </div>
        <button
          type="submit"
          className="w-full font-bold bg-blue-600 text-white py-3 rounded-md hover:bg-blue-500 transition duration-300"
        >
          Sign in
        </button>
        <p
          className="text-sm font-bold text-gray-600 mt-4 text-center cursor-pointer"
          onClick={() => navigateTo('signup')}
        >
          Don't have an account? Sign up instead.
        </p>
      </form>
    </div>
  );
};

export default Login;