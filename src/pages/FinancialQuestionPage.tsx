// src/pages/FinancialQuestionPage.tsx

import React, { useEffect, useState, useRef } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';

const GOOGLE_API_KEY =
  process.env.REACT_APP_GOOGLE_API_KEY

const CLIENT_ID =
  process.env.REACT_CLIENT_ID

interface FinancialQuestionPageProps {
  question: string;
  onBack: () => void;
}

const FinancialQuestionPage: React.FC<FinancialQuestionPageProps> = ({ question, onBack }) => {
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      url: process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || 'http://localhost:8081',
    })
  );

  const [sheetData, setSheetData] = useState<any[]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);

  useEffect(() => {
    const loadGapi = () => {
      gapi.load('client:auth2', initClient);
    };

    const initClient = () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY, // Replace with your API Key
        clientId: CLIENT_ID, // Replace with your Client ID
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      }).then(() => {
        gapi.auth2.getAuthInstance().signIn().then(() => {
          fetchData();
          startPolling();
        });
      }).catch(error => {
        console.error('Error initializing gapi client:', error);
      });
    };

    const fetchData = async () => {
      try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: '1yDnEAod0OEngvA87obxYhg0cqaJCDY_QxnxAUQAxXO8', // Replace with your Google Sheet ID
          range: 'Sheet1!A1:Z100', // Adjust the range as needed
        });
        const data = response.result.values;
        console.log('Fetched Data:', data);
        setSheetData(data);
        return data;
      } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        return [];
      }
    };

    const startPolling = () => {
      const intervalId = setInterval(async () => {
        const newData = await fetchData();
        if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
          console.log('Data changed');
          setPreviousData(newData);
          handleCellChange(newData);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(intervalId); // Cleanup on unmount
    };

    loadGapi();
  }, [previousData]);

  const handleCellChange = (data: any[]) => {
    const client = clientRef.current;
    const formattedData = JSON.stringify(data);
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: formattedData,
      },
    ]);
  };

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
        <h2 className="text-2xl font-bold mt-8">Financial Analysis Question</h2>
        <div className="w-full h-full mt-4">
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

export default FinancialQuestionPage;