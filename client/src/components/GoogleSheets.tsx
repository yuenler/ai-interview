import React, { useEffect } from 'react';

function GoogleSheetsComponent() {
  useEffect(() => {
    // Load the gapi client
    const loadGapi = () => {
      gapi.load('client:auth2', initClient);
    };

    // Initialize the gapi client
    const initClient = () => {
      gapi.client.init({
        apiKey: 'AIzaSyCSd5jqG__AW8dKqK0yFoBo1E3PHD4bbHk', // Replace with your API Key
        clientId: '845894730529-6ttubmq0uhi9c67jgqrei12kgq5963k9.apps.googleusercontent.com', // Replace with your Client ID
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      }).then(() => {
        // Sign in the user
        gapi.auth2.getAuthInstance().signIn().then(() => {
          listMajors();
        });
      }).catch(error => {
        console.error('Error initializing gapi client:', error);
      });
    };

    // Function to list data from Google Sheets
    const listMajors = () => {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: 'YOUR_SHEET_ID', // Replace with your Google Sheet ID
        range: 'Sheet1!A1:Z100', // Adjust the range as needed
      }).then(response => {
        const data = response.result.values;
        console.log('Data from Google Sheets:', data);
        // Process the data as needed
      }).catch(error => {
        console.error('Error fetching data from Google Sheets:', error);
      });
    };

    // Load the gapi client
    loadGapi();
  }, []);

  return <div>Google Sheets Data</div>;
}

export default GoogleSheetsComponent;