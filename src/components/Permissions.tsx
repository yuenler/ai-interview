import React, { useState, useEffect, useRef } from 'react';

interface Props {
  navigateTo: (page: string) => void;
}

const Permissions: React.FC<Props> = ({ navigateTo }) => {
  const [step, setStep] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
        setStatusMessage(`${permissions[step]} access granted. Please verify. Click continue to proceed.`);
      }
    } catch (error) {
      setErrorMessage(`Failed to get ${permissions[step]} access. Please ensure you have granted the necessary permissions.`);
    }
  };

  const handleContinue = () => {
    if (step < permissions.length - 1) {
      setStep(step + 1);
      setMediaStream(null);
      setStatusMessage(null);
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
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow-md w-[40rem] text-center">
        <h2 className="text-3xl font-bold mb-6">
          Enable {permissions[step]} Access
        </h2>
        <button
          onClick={requestPermission}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mb-4"
        >
          Enable
        </button>
        {statusMessage && (
          <p className="text-green-700 bg-green-200 py-2 px-4 rounded mt-4">{statusMessage}</p>
        )}
        {errorMessage && (
          <p className="text-red-700 bg-red-200 py-2 px-4 rounded mt-4">{errorMessage}</p>
        )}
        {mediaStream && permissions[step] === 'Webcam' && (
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video) video.srcObject = mediaStream;
            }}
            className="w-full mt-4"
          />
        )}
        {mediaStream && permissions[step] === 'Screen Sharing' && (
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video) video.srcObject = mediaStream;
            }}
            className="w-full mt-4"
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
            <div className="w-full h-20 bg-gray-300 rounded overflow-hidden relative">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <p className="mt-2 text-gray-700">Speak into your microphone to see the volume level change.</p>
          </div>
        )}
        {mediaStream && (
          <button
            onClick={handleContinue}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default Permissions;
