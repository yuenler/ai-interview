import React from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Instructions: React.FC<Props> = ({ navigateTo }) => {

  const handleStart = () => {
    navigateTo('interview');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Technical Interview Instructions
        </h2>
        <p className="mb-6 text-lg text-gray-700 text-center">
          You will be presented with multiple technical interview questions. You have <span className="font-bold">1 hour</span> to solve the questions. Good luck!
        </p>

        <ul className="list-disc list-inside mb-6 text-gray-600">
          <li className="mb-2">No web searches</li>
          <li className="mb-2">No use of generative AI tools</li>
          <li className="mb-2">No collaboration with others</li>
          <li className="mb-2">No use of notes or external materials</li>
        </ul>

        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
