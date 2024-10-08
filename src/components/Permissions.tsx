import React, { useState, useEffect, useRef } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Permissions: React.FC<Props> = ({ navigateTo }) => {
  const [step, setStep] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioRef = useRef<null | AnalyserNode>(null);

  const permissions = ['Microphone', 'Webcam', 'Screen Sharing'];
  const requestPermission = async () => {
    try {
      setErrorMessage(null);
      let stream: MediaStream | null = null;
      if (permissions[step] === 'Microphone') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        audioRef.current = analyser;

        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(avg);
          requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      } else if (permissions[step] === 'Webcam') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } else if (permissions[step] === 'Screen Sharing') {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      }

      if (stream) {
        setMediaStream(stream);
      }
    } catch (error) {
      setErrorMessage(`Failed to get ${permissions[step]} access. Please ensure you have granted the necessary permissions.`);
    }
  };

  const handleContinue = () => {
    if (step < permissions.length - 1) {
      setStep(step + 1);
      setMediaStream(null);
      setErrorMessage(null);
    } else {
      navigateTo('instructions');
    }
  };

  useEffect(() => {
    // Cleanup media stream and audio analyser when component is unmounted or step changes
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [step, mediaStream]);

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white shadow-lg p-6 rounded-lg flex w-3/4">
        {/* Checklist Sidebar */}
        <div className="w-1/4 bg-gray-50 p-4 rounded-l-lg border-r-2 border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>
          <ul>
            {permissions.map((permission, index) => (
              <li
                key={permission}
                className={`flex items-center mb-2 ${index <= step ? 'text-green-600' : 'text-gray-500'}`}
              >
                <span
                  className={`mr-2 h-4 w-4 rounded-full border-2 ${
                    index <= step ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}
                ></span>
                {permission}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-8">
          <h2 className="text-2xl font-bold mb-6">Enable {permissions[step]} Access</h2>
          {!mediaStream && (
            <button
              onClick={requestPermission}
              className="bg-blue-600 font-bold text-white py-2 px-6 rounded hover:bg-blue-700 mb-4 transition-all"
            >
              Enable {permissions[step]}
            </button>
          )}
          {errorMessage && (
            <p className="text-red-700 bg-red-100 py-2 px-4 rounded mb-4">{errorMessage}</p>
          )}
          {mediaStream && permissions[step] === 'Webcam' && (
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) video.srcObject = mediaStream;
              }}
              className="w-full rounded-md shadow-md mt-4"
            />
          )}
          {mediaStream && permissions[step] === 'Screen Sharing' && (
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) video.srcObject = mediaStream;
              }}
              className="w-full rounded-md shadow-md mt-4"
            />
          )}
          {mediaStream && permissions[step] === 'Microphone' && (
            <div className="mt-4">
              <audio
                autoPlay
                ref={(audio) => {
                  if (audio) audio.srcObject = mediaStream;
                }}
                className="hidden"
              />
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className="mt-2 text-gray-700">Speak into your microphone to see the volume level.</p>
            </div>
          )}
          {mediaStream && (
            <button
              onClick={handleContinue}
              className="mt-6 bg-green-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-green-700 transition-all"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permissions;
