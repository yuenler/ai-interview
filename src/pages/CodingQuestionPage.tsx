/**
 * Coding Question Page Component
 */
import React, { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css'; // Optional: You can choose another theme

import 'highlight.js/lib/languages/javascript'; // Replace with your desired language

function CodingQuestionPage({
  onBack,
  onCodeChange,
  code,
}: {
  code: string;
  onBack: () => void;
  onCodeChange: (code: string) => void;
}) {


  return (
    <div>
      <button
      type="button"
      className="py-1 m-2 px-4 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
      onClick={onBack}
      >
      Back to Questions
      </button>
      <Editor
      value={code}
      onValueChange={(newCode) => onCodeChange(newCode)}
      highlight={(code) => hljs.highlight(code, { language: 'python' }).value} // Use Python for highlighting
      padding={10}
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 16,
        border: '1px solid #ddd',
        borderRadius: '4px',
        minHeight: '300px',
      }}
      />
    </div>
  );
}

export default CodingQuestionPage;
