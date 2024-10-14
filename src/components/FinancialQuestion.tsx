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
    const fetchData = async () => {
      console.log("attempting fetch");
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbz-EASFbjbSAoIjqWApf1lpX7W1-gJao1Va7umfVY07cdGL8FLcHF11Nz9fuwLiS4gn/exec', {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({}), // Send an empty object or any necessary data
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        console.log('Fetched Data:', data);
        setSheetData(data);
        handleCellChange(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
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
          console.log('Data changed');
          setPreviousData(newData);
          setSheetData(newData);
          handleCellChange(newData);
          setChangeDetected(`Data changed at ${new Date().toLocaleTimeString()}`);
        }
      }, 50000); // Poll every 5 seconds

      return () => clearInterval(intervalId); // Cleanup on unmount
    };

    startPolling();
  }, [previousData, handleCellChange]);


  // Gapi method below

  // useEffect(() => {
  //   const loadGapi = () => {
  //     console.log('Attempting to load gapi...');
  //     gapi.load('client:auth2', initClient);
  //   };

  //   const initClient = () => {
  //     gapi.client.init({
  //       apiKey: 'AIzaSyCSd5jqG__AW8dKqK0yFoBo1E3PHD4bbHk', // Replace with your API Key
  //       clientId: '845894730529-6ttubmq0uhi9c67jgqrei12kgq5963k9.apps.googleusercontent.com', // Replace with your Client ID
  //       discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  //       scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  //     }).then(() => {
  //       gapi.auth2.getAuthInstance().signIn().then(() => {
  //         fetchData();
  //         startPolling();
  //       });
  //     }).catch(error => {
  //       console.error('Error initializing gapi client:', error);
  //     });
  //   };

  //   const fetchData = async () => {
  //     try {
  //       const response = await gapi.client.sheets.spreadsheets.values.get({
  //         spreadsheetId: '1yDnEAod0OEngvA87obxYhg0cqaJCDY_QxnxAUQAxXO8', // Replace with your Google Sheet ID
  //         range: 'Sheet1!A1:Z100', // Adjust the range as needed
  //       });
  //       const data = response.result.values;
  //       console.log('Fetched Data:', data);
  //       setSheetData(data);
  //       return data;
  //     } catch (error) {
  //       console.error('Error fetching data from Google Sheets:', error);
  //       return [];
  //     }
  //   };

  //   const startPolling = () => {
  //     const intervalId = setInterval(async () => {
  //       const newData = await fetchData();
  //       if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
  //         console.log('Data changed');
  //         setPreviousData(newData);
  //         handleCellChange(newData);
  //       }
  //     }, 5000); // Poll every 5 seconds

  //     return () => clearInterval(intervalId); // Cleanup on unmount
  //   };

  //   loadGapi();
  // }, [previousData]);


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
