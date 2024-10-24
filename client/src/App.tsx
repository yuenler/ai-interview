// App.tsx
import React, { useState, useEffect, useContext } from 'react';
import Interview from './pages/Interview';
import Permissions from './pages/Permissions';
import Instructions from './pages/Instructions';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { UserContext } from './UserContext'; // Remove UserProvider import
import AdminDashboard from './pages/AdminDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import NavBar from './components/NavBar'; // Import NavBar

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [interviewId, setInterviewId] = useState<string>('');

  const setMediaStreams = (streams: {
    audioStream: MediaStream | null;
    videoStream: MediaStream | null;
    screenStream: MediaStream | null;
  }) => {
    setAudioStream(streams.audioStream);
    setVideoStream(streams.videoStream);
    setScreenStream(streams.screenStream);
  };

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  const { user } = useContext(UserContext); // Access user from context

  useEffect(() => {
    if (user) {
      if (user.userType === 'recruiter') {
        setCurrentPage('adminDashboard');
      } else {
        setCurrentPage('applicantDashboard');
      }
    } else {
      setCurrentPage('login');
    }
  }, [user]);

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
            interviewId={interviewId}
          />
        );
      case 'adminDashboard':
        return <AdminDashboard navigateTo={navigateTo} />;
      case 'applicantDashboard':
        return <ApplicantDashboard navigateTo={navigateTo} setInterviewId={setInterviewId} />;
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  return (
    <div>
      {/* Render NavBar if user is logged in */}
      {user && <NavBar navigateTo={navigateTo} />}
      {/* Add padding to avoid content being hidden behind NavBar */}
      <div className={user ? 'pt-16' : ''}>{renderPage()}</div>
    </div>
  );
};

export default App;
