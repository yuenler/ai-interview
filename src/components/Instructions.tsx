import React from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Instructions: React.FC<Props> = ({navigateTo}) => {

  const handleStart = () => {
    navigateTo('interview');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow-md w-2/3">
        <h2 className="text-2xl font-bold mb-4">Instructions</h2>
        <p className="mb-6">
          You will be presented with questions. You have 1 hour to solve the questions. Good luck!
        </p>
        <button
          onClick={handleStart}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};

export default Instructions;
