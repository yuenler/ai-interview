// Signup.tsx
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  navigateTo: (page: string) => void;
}

const Signup: React.FC<Props> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('job_candidate'); // Default user type
  const [name, setName] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      // Store user type in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name,
        userType: userType,
      });
      navigateTo(userType === 'recruiter' ? 'adminDashboard' : 'applicantDashboard');
    } catch (error: any) {
      console.error('Error signing up:', error);
      alert(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!userType) {
      alert('Please select your user type before signing up.');
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      // Store user type and name in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.displayName || '',
        userType: userType,
      });
      navigateTo(userType === 'recruiter' ? 'adminDashboard' : 'applicantDashboard');
    } catch (error: any) {
      console.error('Error signing up with Google:', error);
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
          Create your account
        </h2>
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold">Name</label>
          <input
            type="text"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
        {/* Confirm Password Input */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold">
            Confirm Password
          </label>
          <input
            type="password"
            className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {/* User Type Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">I am a:</label>
          <div className="flex items-center">
            <input
              type="radio"
              id="job_candidate"
              name="userType"
              value="job_candidate"
              checked={userType === 'job_candidate'}
              onChange={(e) => setUserType(e.target.value)}
              className="mr-2"
            />
            <label htmlFor="job_candidate" className="mr-4">
              Job Candidate
            </label>
            <input
              type="radio"
              id="recruiter"
              name="userType"
              value="recruiter"
              checked={userType === 'recruiter'}
              onChange={(e) => setUserType(e.target.value)}
              className="mr-2"
            />
            <label htmlFor="recruiter">Recruiter</label>
          </div>
        </div>
        {/* Sign Up Button */}
        <button
          type="submit"
          className="w-full font-bold bg-blue-600 text-white py-3 rounded-md hover:bg-blue-500 transition duration-300"
        >
          Sign Up
        </button>
        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full font-bold bg-red-600 text-white py-3 rounded-md hover:bg-red-500 transition duration-300 mt-4"
        >
          Sign Up with Google
        </button>
        {/* Navigate to Login */}
        <p
          className="text-sm font-bold text-gray-600 mt-4 text-center cursor-pointer"
          onClick={() => navigateTo('login')}
        >
          Already have an account? Log in instead.
        </p>
      </form>
    </div>
  );
};

export default Signup;
