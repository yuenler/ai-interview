import React, { useEffect, useState } from 'react';

interface FinancialQuestionPageProps {
  question: string;
  onBack: () => void;
  handleCellChange: (data: any[]) => void;
}

const FinancialQuestion: React.FC<FinancialQuestionPageProps> = ({ question, onBack, handleCellChange }) => {
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);
  const [changeDetected, setChangeDetected] = useState<string | null>(null);

  // Apps Script method

  useEffect(() => {
    const fetchData = () => {
      console.log("attempting fetch");
      fetch('https://script.google.com/macros/s/AKfycbz-EASFbjbSAoIjqWApf1lpX7W1-gJao1Va7umfVY07cdGL8FLcHF11Nz9fuwLiS4gn/exec', 
        // {method: 'GET',
        // mode: 'cors',
        // headers: {
        //   'Content-Type': 'application/json',
        // },}
      )
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched Data:', data);
        if (Array.isArray(data.data)) {
          setSheetData(data.data);
          handleCellChange(data.data);
        } else {
          console.error('Expected an array but got:', data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    };

    fetchData();
  }, [handleCellChange]);
  
  useEffect(() => {
    const startPolling = () => {
      const intervalId = setInterval(async () => {
        const newData = await fetch('https://script.google.com/macros/s/AKfycbz-EASFbjbSAoIjqWApf1lpX7W1-gJao1Va7umfVY07cdGL8FLcHF11Nz9fuwLiS4gn/exec')
          .then(response => response.json())
          .catch(error => {
            console.error('Error fetching data:', error);
            return [];
          });

        if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
          console.log('Data changed:', newData);
          setPreviousData(newData);
          // setSheetData(newData);
          const parsedData = JSON.parse(newData.body);
          console.log('parsed data:', parsedData);
          setSheetData(parsedData);
          console.log('sheet data:', sheetData);
          handleCellChange(newData);
          setChangeDetected(`Data changed at ${new Date().toLocaleTimeString()}`);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(intervalId); // Cleanup on unmount
    };

    startPolling();
  }, [previousData, handleCellChange]);



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
        <h3>Spreadsheet Data: {changeDetected}</h3>
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
