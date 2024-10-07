
/**
 * Coding Question Page Component
 */
import React, { useEffect, useState } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css'; // Optional: If you want to use a theme
import 'codemirror/mode/javascript/javascript'; // Replace with the appropriate language mode

function CodingQuestionPage({
  question,
  onBack,
  onCodeChange,
}: {
  question: string;
  onBack: () => void;
  onCodeChange: (code: string) => void;
}) {
  const [code, setCode] = useState(`/**\n * ${question}\n */\n\n`);

  // Debounce code changes to send significant changes to the client
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onCodeChange(code);
    }, 5000); // Adjust the debounce timing as needed

    return () => clearTimeout(timeoutId);
  }, [code]);

  return (
    <div className="coding-question-page">
      <button
        type="button"
        className="py-1 m-2 px-4 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        onClick={onBack}
      >
        Back to Questions
      </button>
      <CodeMirror
        value={code}
        options={{
          mode: 'python', 
          theme: 'default',
          lineNumbers: true,
        }}
        onBeforeChange={(editor:any, data:any, value: string) => {
          setCode(value);
        }}
      />
    </div>
  );
}

export default CodingQuestionPage;
