import React from 'react';
import Editor from 'react-simple-code-editor';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import 'highlight.js/lib/languages/javascript'; // Replace with your desired language
import './CodingQuestion.scss'; // Custom styles for line numbers

function CodingQuestion({
  onBack,
  onCodeChange,
  code,
}: {
  code: string;
  onBack: () => void;
  onCodeChange: (code: string) => void;
}) {

  const renderLineNumbers = (text: string) => {
    return Array.from(text.split('\n'), (_, i) => {
      return (
        <div className="line-number" key={i}>
          {i + 1}
        </div>
      );
    });
  };

  const fontSizeRem = 0.8;

  return (
    <div
      style={{
      color: '#fff',
      backgroundColor: '#222',
      padding: '20px',
      height: '100vh',
      width: '100vw',
      boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        className="py-1 m-2 px-4 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        onClick={onBack}
      >
        Back to Questions
      </button>

      <div style={{ display: 'flex' }}>
        {/* Line numbers */}
        <div
          className="line-numbers font-monospace"
          style={{
            fontSize: `${fontSizeRem}rem`,
          }}
        >
          {renderLineNumbers(code)}
        </div>

        {/* Code Editor */}
        <Editor
          value={code}
          onValueChange={(newCode) => onCodeChange(newCode)}
          highlight={(code) => hljs.highlight(code, { language: 'python' }).value} // Use Python for highlighting
          padding="1em"
          autoFocus
          style={{
            fontFamily: 'monospace',
            fontSize: `${fontSizeRem}rem`,
            minHeight: `${fontSizeRem * 30}rem`,
          }}
        />
      </div>
    </div>
  );
}

export default CodingQuestion;
