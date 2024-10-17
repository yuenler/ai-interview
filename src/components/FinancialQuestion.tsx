import React, { useEffect, useState } from 'react';

interface FinancialQuestionPageProps {
  question: string;
  onBack: () => void;
  onCellChange: (data: any[]) => void;
  sheetData: any[][];
}

const FinancialQuestion: React.FC<FinancialQuestionPageProps> = ({ question, onBack, onCellChange, sheetData }) => {
  
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const newData = await fetch('https://script.google.com/macros/s/AKfycbz-EASFbjbSAoIjqWApf1lpX7W1-gJao1Va7umfVY07cdGL8FLcHF11Nz9fuwLiS4gn/exec')
        .then(response => response.json())
        .catch(error => {
          console.error('Error fetching data:', error);
          return [];
        });
  
      if (newData.body) {
        const parsedData = JSON.parse(newData.body);
  
        // Transform the parsed data as needed
        const transformedData = Object.entries(parsedData).map(([key, value]) => [key, value]);
  
        // Update sheetData state with the transformed data
        console.log('Updated sheet data:', transformedData);
        
        // Notify that the sheet data has changed
        onCellChange(transformedData);
      } else {
        console.log('No body in the new data:', newData);
      }        
    }, 5000); // Poll every 5 seconds
  
    // Cleanup function to clear the interval
    return () => clearInterval(intervalId); 
  }, []);
  

  return (
    <div>
      <button
        type="button"
        className="py-1 m-2 px-4 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        onClick={onBack}
      >
        Back to Questions
      </button>
      <div className="flex flex-col items-center h-screen bg-gray-200">
        <div className="w-full h-full">
        <table className="min-w-full bg-white">
            <thead>
              <tr>
                {sheetData[0]?.map((header: string, index: number) => (
                  <th key={index} className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm leading-4 font-medium text-gray-600 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.slice(1).map((row: any[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="py-2 px-4 border-b border-gray-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <iframe
            src="https://docs.google.com/spreadsheets/d/1yDnEAod0OEngvA87obxYhg0cqaJCDY_QxnxAUQAxXO8/edit?usp=sharing"
            title="Financial Analysis Sheet"
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default FinancialQuestion;
