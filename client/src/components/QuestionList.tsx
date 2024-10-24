
import React from 'react';

function QuestionList({
  onSelectQuestion,
}: {
  onSelectQuestion: (questionType: 'lboQuestion' | 'codingQuestion' | 'financialQuestion') => void;
}) {
  return (
    <div className="question-list-page flex items-center justify-center h-screen bg-blue-50">
      <div className="text-center">
      <h2 className="text-4xl font-bold mb-8">Assigned Questions</h2>
      <div className="space-y-4 flex flex-col items-center">
        <button
        onClick={() => onSelectQuestion('lboQuestion')}
        className="w-full max-w-md py-4 px-8 bg-blue-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
        LBO Modeling 
        </button>
        <button
        onClick={() => onSelectQuestion('codingQuestion')}
        className="w-full max-w-md py-4 px-8 bg-green-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300"
        >
        Algorithms
        </button>
        <button
        onClick={() => onSelectQuestion('financialQuestion')}
        className="w-full max-w-md py-4 px-8 bg-purple-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300"
        >
        Financial Analysis
        </button>
      </div>
      </div>
    </div>
  );
}

export default QuestionList;
