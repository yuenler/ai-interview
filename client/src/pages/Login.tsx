// Login.tsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

interface Props {
  navigateTo: (page: string) => void;
}

const Login: React.FC<Props> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigateTo('applicantDashboard');
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigateTo('applicantDashboard');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      alert(error.message);
    }
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
        {/* Email Input */}
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
        {/* Password Input */}
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
        {/* Forgot Password Link */}
        <div className="text-right mb-6">
          <a
            href="#"
            className="text-sm font-bold text-blue-600 hover:underline"
            onClick={() => navigateTo('forgot-password')}
          >
            Forgot password?
          </a>
        </div>
        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full font-bold bg-blue-600 text-white py-3 rounded-md hover:bg-blue-500 transition duration-300"
        >
          Sign in
        </button>
        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full font-bold bg-red-600 text-white py-3 rounded-md hover:bg-red-500 transition duration-300 mt-4"
        >
          Sign in with Google
        </button>
        {/* Navigate to Signup */}
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
