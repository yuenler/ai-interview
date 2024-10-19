// App.tsx
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import Interview from './pages/Interview';
import Permissions from './pages/Permissions';
import Instructions from './pages/Instructions';
import Login from './pages/Login';
import Signup from './pages/Signup';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const setMediaStreams = (streams: {
    audioStream: MediaStream | null;
    videoStream: MediaStream | null;
    screenStream: MediaStream | null;
  }) => {
    setAudioStream(streams.audioStream);
    setVideoStream(streams.videoStream);
    setScreenStream(streams.screenStream);
  };

  console.log('audioStream', audioStream);
  console.log('videoStream', videoStream);
  console.log('screenStream', screenStream);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // User is signed in
        setCurrentPage('permissions');
      } else {
        // User is signed out
        setCurrentPage('login');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Cleanup function when component unmounts or when streams change
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioStream, videoStream, screenStream]);


  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login navigateTo={navigateTo} />;
      case 'signup':
        return <Signup navigateTo={navigateTo} />;
      case 'permissions':
        return <Permissions navigateTo={navigateTo} setMediaStreams={setMediaStreams} />;
      case 'instructions':
          return <Instructions navigateTo={navigateTo} />;
      case 'interview':
        return (
            <Interview
              audioStream={audioStream}
              videoStream={videoStream}
              screenStream={screenStream}
              navigateTo={navigateTo}
            />
          );
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  return renderPage();
};

export default App;
